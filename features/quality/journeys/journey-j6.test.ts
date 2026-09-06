import { beforeEach, describe, expect, it, vi } from "vitest";

import { evaluateParticipantPunishment } from "@/features/accountability/domain/punishment";
import {
  finalizeChallenge,
  ChallengeValidationError,
} from "@/features/challenges/data/admin-challenge.repository";
import {
  adminPardonParticipant,
  adminRevokePardon,
} from "@/features/accountability/data/pardon.repository";
import { generateDiscordSummary } from "@/features/discord/domain/discord-summary";
import { prisma as basePrisma } from "@/core/db";

const prisma = basePrisma as any;

vi.mock("@/core/db", () => {
  const mockPrisma = {
    $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
    challenge: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    challengeParticipant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    punishmentRecord: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Journey J6: Event Lock, Dual-Failure Auto-Punishment & Discord Summary (Law L2, L5, L6)", () => {
  const actor = { id: "host-1", username: "host_alex" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("J6.1: Dual-Failure Accountability Invariant (Law L6)", () => {
    const targetSeconds = 126000; // 35h

    it("Permutation 1: Hours Met + Goals Met => Not Punished", () => {
      const evaluation = evaluateParticipantPunishment(
        targetSeconds,
        144000, // 40h (exceeded)
        [{ completed: true }, { completed: true }, { completed: true }],
      );

      expect(evaluation.isPunished).toBe(false);
      expect(evaluation.reasons).toEqual([]);
      expect(evaluation.incompleteGoals).toBe(0);
      expect(evaluation.hoursDeficitSeconds).toBe(0);
    });

    it("Permutation 2: Hours Failed + Goals Met => Punished (Hours Deficit)", () => {
      const evaluation = evaluateParticipantPunishment(
        targetSeconds,
        108000, // 30h (5h deficit)
        [{ completed: true }, { completed: true }],
      );

      expect(evaluation.isPunished).toBe(true);
      expect(evaluation.reasons).toEqual(["hours_deficit"]);
      expect(evaluation.hoursDeficitSeconds).toBe(18000); // 5 hours
      expect(evaluation.incompleteGoals).toBe(0);
    });

    it("Permutation 3: Hours Met + Goals Failed => Punished (Incomplete Goals)", () => {
      const evaluation = evaluateParticipantPunishment(
        targetSeconds,
        126000, // exact 35h
        [{ completed: true }, { completed: false }], // 1 incomplete goal
      );

      expect(evaluation.isPunished).toBe(true);
      expect(evaluation.reasons).toEqual(["incomplete_goals"]);
      expect(evaluation.hoursDeficitSeconds).toBe(0);
      expect(evaluation.incompleteGoals).toBe(1);
    });

    it("Permutation 4: Hours Failed + Goals Failed => Punished (Dual Failure)", () => {
      const evaluation = evaluateParticipantPunishment(
        targetSeconds,
        72000, // 20h (15h deficit)
        [{ completed: false }, { completed: false }], // 2 incomplete goals
      );

      expect(evaluation.isPunished).toBe(true);
      expect(evaluation.reasons).toEqual(["hours_deficit", "incomplete_goals"]);
      expect(evaluation.hoursDeficitSeconds).toBe(54000); // 15 hours
      expect(evaluation.incompleteGoals).toBe(2);
    });
  });

  describe("J6.2: Event Lock Lifecycle & Mass Punishment Evaluation", () => {
    it("transitions challenge ACTIVE -> COMPLETED and upserts punishment records", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        title: "Hive Wars",
        status: "ACTIVE",
        participants: [
          {
            id: "part-1",
            targetSeconds: 126000,
            status: "ACTIVE",
            dailyStudyLogs: [{ durationSeconds: 144000 }],
            weeklyGoals: [{ completed: true }],
          },
          {
            id: "part-2",
            targetSeconds: 126000,
            status: "ACTIVE",
            dailyStudyLogs: [{ durationSeconds: 72000 }], // failed hours
            weeklyGoals: [{ completed: false }], // failed goals
          },
        ],
      } as any);

      vi.mocked(prisma.challenge.update).mockResolvedValueOnce({
        id: "chal-1",
        status: "COMPLETED",
      } as any);

      const result = await finalizeChallenge("chal-1", actor);

      expect(result.status).toBe("COMPLETED");

      // Part 1: Not punished
      expect(prisma.punishmentRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { participantId: "part-1" },
          create: expect.objectContaining({ isPunished: false }),
        }),
      );

      // Part 2: Punished
      expect(prisma.punishmentRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { participantId: "part-2" },
          create: expect.objectContaining({ isPunished: true }),
        }),
      );
      expect(prisma.challengeParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "part-2" },
          data: { status: "PUNISHED" },
        }),
      );

      // Audit entry created
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionType: "CHALLENGE_LOCKED",
            targetEntityId: "chal-1",
          }),
        }),
      );
    });

    it("rejects locking if challenge is already COMPLETED", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        status: "COMPLETED",
        participants: [],
      } as any);

      await expect(finalizeChallenge("chal-1", actor)).rejects.toThrow(
        /already in status "COMPLETED"/i,
      );
    });
  });

  describe("J6.3: Host Pardon & Revocation Workflow (Law L5)", () => {
    it("pardons participant, sets isPardoned = true, status = EXCUSED, and writes audit log", async () => {
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
        id: "part-2",
        challengeId: "chal-1",
        status: "PUNISHED",
        punishmentRecord: { id: "pun-2", isPardoned: false },
      } as any);

      vi.mocked(prisma.punishmentRecord.upsert).mockResolvedValueOnce({
        id: "pun-2",
        isPardoned: true,
        pardonReason: "Family medical emergency confirmed",
      } as any);

      const result = await adminPardonParticipant({
        challengeId: "chal-1",
        participantId: "part-2",
        reason: "Family medical emergency confirmed",
        actor,
      });

      expect(result.isPardoned).toBe(true);
      expect(prisma.challengeParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "part-2" },
          data: { status: "EXCUSED" },
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionType: "PARTICIPANT_PARDONED",
            targetEntityId: "part-2",
            auditReason: "Family medical emergency confirmed",
          }),
        }),
      );
    });

    it("revokes pardon, resets status to PUNISHED, and records audit trail", async () => {
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
        id: "part-2",
        challengeId: "chal-1",
        status: "EXCUSED",
        punishmentRecord: { id: "pun-2", isPardoned: true },
      } as any);

      vi.mocked(prisma.punishmentRecord.update).mockResolvedValueOnce({
        id: "pun-2",
        isPardoned: false,
      } as any);

      const result = await adminRevokePardon({
        challengeId: "chal-1",
        participantId: "part-2",
        reason: "Proof was discovered to be fraudulent",
        actor,
      });

      expect(result.isPardoned).toBe(false);
      expect(prisma.challengeParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "part-2" },
          data: { status: "PUNISHED" },
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionType: "PARDON_REVOKED",
            targetEntityId: "part-2",
            auditReason: "Proof was discovered to be fraudulent",
          }),
        }),
      );
    });

    it("rejects pardon if participant belongs to a different challenge (Cross-Challenge Security)", async () => {
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
        id: "part-foreign",
        challengeId: "chal-other",
      } as any);

      await expect(
        adminPardonParticipant({
          challengeId: "chal-1",
          participantId: "part-foreign",
          reason: "Unauthorized attempt",
          actor,
        }),
      ).rejects.toThrow(/Participant does not belong to this challenge/);
    });
  });

  describe("J6.4: 1-Click Discord Markdown Summary Generator (Law L2)", () => {
    it("generates markdown summary with winning house, individual podium, and accountability nook", () => {
      const summaryMarkdown = generateDiscordSummary({
        challenge: {
          id: "chal-1",
          title: "Winter Finals Clash",
          format: "TEAM_VS_TEAM",
          status: "COMPLETED",
          startAt: new Date("2026-09-01"),
          endAt: new Date("2026-09-08"),
          punishmentPfpUrl: "https://example.com/punishment.png",
        },
        teams: [
          { id: "t1", name: "Bees", iconEmoji: "🐝", totalSeconds: 180000, memberCount: 2 },
          { id: "t2", name: "Butterflies", iconEmoji: "🦋", totalSeconds: 144000, memberCount: 2 },
        ],
        leadMargin: {
          marginSeconds: 36000,
          leader: "a",
          leadingTeam: { name: "Bees" },
          isTie: false,
        },
        participants: [
          {
            id: "p1",
            displayName: "Queen Bee",
            username: "queenbee",
            teamName: "Bees",
            totalLoggedSeconds: 108000,
            targetSeconds: 100000,
            progressPercent: 108,
            rank: 1,
            completedGoalsCount: 3,
            totalGoalsCount: 3,
            punishmentEvaluation: {
              isPunished: false,
              hoursDeficitSeconds: 0,
              incompleteGoals: 0,
            },
          },
          {
            id: "p2",
            displayName: "Sleepy Caterpillar",
            username: "caterpillar",
            teamName: "Butterflies",
            totalLoggedSeconds: 36000,
            targetSeconds: 72000,
            progressPercent: 50,
            rank: 2,
            completedGoalsCount: 1,
            totalGoalsCount: 3,
            punishmentEvaluation: {
              isPunished: true,
              hoursDeficitSeconds: 36000, // 10h
              incompleteGoals: 2,
            },
          },
        ],
      });

      expect(summaryMarkdown).toContain("# 🏆 Final Challenge Results: Winter Finals Clash");
      expect(summaryMarkdown).toContain("🎉 **Winning House:** Bees");
      expect(summaryMarkdown).toContain("🥇 **Queen Bee** (@queenbee) — `30:00:00` (Bees)");
      expect(summaryMarkdown).toContain("### ⚠️ The Accountability Nook (Forfeits):");
      expect(summaryMarkdown).toContain(
        "- 🚨 **Sleepy Caterpillar** (@caterpillar) — -10h hours, 2 unfinished goals",
      );
    });
  });
});
