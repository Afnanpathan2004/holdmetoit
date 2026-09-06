import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChallenge,
  kickoffChallenge,
  finalizeChallenge,
  enrollParticipant,
  renameDuoTeam,
  ChallengeValidationError,
} from "./admin-challenge.repository";
import { prisma } from "@/core/db";
import { InvalidLifecycleTransitionError, LifecyclePrerequisiteError } from "@/features/challenges/domain/lifecycle";

vi.mock("@/core/db", () => {
  const mockPrisma = {
    $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
    challenge: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    challengeParticipant: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    punishmentRecord: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("admin-challenge.repository", () => {
  const actor = { id: "admin-user", username: "host_alex" };
  const baseStart = new Date("2026-09-01T00:00:00Z");
  const baseEnd = new Date("2026-09-08T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createChallenge", () => {
    it("validates required fields and dates", async () => {
      await expect(
        createChallenge(
          {
            title: "   ",
            format: "TEAM_VS_TEAM",
            startAt: baseStart,
            endAt: baseEnd,
            teams: [{ name: "Bees" }],
          },
          "host-1",
          actor,
        ),
      ).rejects.toThrow(ChallengeValidationError);

      await expect(
        createChallenge(
          {
            title: "Battle",
            format: "TEAM_VS_TEAM",
            startAt: baseEnd,
            endAt: baseStart, // invalid dates
            teams: [{ name: "Bees" }],
          },
          "host-1",
          actor,
        ),
      ).rejects.toThrow(ChallengeValidationError);

      await expect(
        createChallenge(
          {
            title: "Battle",
            format: "TEAM_VS_TEAM",
            startAt: baseStart,
            endAt: baseEnd,
            teams: [], // empty teams
          },
          "host-1",
          actor,
        ),
      ).rejects.toThrow(ChallengeValidationError);
    });

    it("applies Law L1: SOLOS -> maxMembers = 1 and DUOS -> maxMembers = 2", async () => {
      vi.mocked(prisma.challenge.create).mockResolvedValueOnce({
        id: "chal-solo",
        title: "Solo Arena",
        format: "SOLOS",
        status: "UPCOMING",
        teams: [{ id: "t1", name: "Solo Slot 1", maxMembers: 1 }],
      } as any);

      await createChallenge(
        {
          title: "Solo Arena",
          format: "SOLOS",
          startAt: baseStart,
          endAt: baseEnd,
          teams: [{ name: "Solo Slot 1" }],
        },
        "host-1",
        actor,
      );

      expect(prisma.challenge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          format: "SOLOS",
          teams: {
            create: [
              expect.objectContaining({
                name: "Solo Slot 1",
                maxMembers: 1, // Law L1: Solo = 1
              }),
            ],
          },
        }),
        include: expect.any(Object),
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionType: "CHALLENGE_CREATED",
          actorId: "admin-user",
        }),
      });
    });
  });

  describe("kickoffChallenge", () => {
    it("transitions UPCOMING to ACTIVE and creates audit log", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        title: "House Cup",
        status: "UPCOMING",
        teams: [{ id: "t1" }, { id: "t2" }],
        participants: [{ id: "p1" }, { id: "p2" }],
      } as any);

      vi.mocked(prisma.challenge.update).mockResolvedValueOnce({
        id: "chal-1",
        status: "ACTIVE",
      } as any);

      const updated = await kickoffChallenge("chal-1", actor);

      expect(updated.status).toBe("ACTIVE");
      expect(prisma.challenge.update).toHaveBeenCalledWith({
        where: { id: "chal-1" },
        data: { status: "ACTIVE" },
        include: expect.any(Object),
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionType: "CHALLENGE_KICKOFF",
          targetEntityId: "chal-1",
        }),
      });
    });

    it("throws LifecyclePrerequisiteError if no teams or participants are present", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        status: "UPCOMING",
        teams: [],
        participants: [],
      } as any);

      await expect(kickoffChallenge("chal-1", actor)).rejects.toThrow(
        LifecyclePrerequisiteError,
      );
    });

    it("throws InvalidLifecycleTransitionError if challenge is already ACTIVE", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        status: "ACTIVE",
        teams: [{ id: "t1" }],
        participants: [{ id: "p1" }],
      } as any);

      await expect(kickoffChallenge("chal-1", actor)).rejects.toThrow(
        InvalidLifecycleTransitionError,
      );
    });
  });

  describe("finalizeChallenge", () => {
    it("transitions ACTIVE to COMPLETED, evaluates dual-failure punishments, and flags members", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        title: "House Cup",
        status: "ACTIVE",
        participants: [
          // p1: target 36000, logged 18000 (deficit 18000), 1 goal incomplete -> punished
          {
            id: "p1",
            targetSeconds: 36000,
            status: "NORMAL",
            dailyStudyLogs: [{ durationSeconds: 18000 }],
            weeklyGoals: [{ completed: false }],
          },
          // p2: target 36000, logged 36000, all goals complete -> NOT punished
          {
            id: "p2",
            targetSeconds: 36000,
            status: "NORMAL",
            dailyStudyLogs: [{ durationSeconds: 36000 }],
            weeklyGoals: [{ completed: true }],
          },
        ],
      } as any);

      vi.mocked(prisma.challenge.update).mockResolvedValueOnce({
        id: "chal-1",
        status: "COMPLETED",
      } as any);

      const result = await finalizeChallenge("chal-1", actor);
      expect(result.status).toBe("COMPLETED");

      // Verify p1 received a punishment record with isPunished = true
      expect(prisma.punishmentRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { participantId: "p1" },
          create: expect.objectContaining({
            isPunished: true,
            hoursDeficitSeconds: 18000,
            incompleteGoalsCount: 1,
          }),
        }),
      );

      // Verify p1 participant row status updated to PUNISHED
      expect(prisma.challengeParticipant.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { status: "PUNISHED" },
      });

      // Verify p2 received a punishment record with isPunished = false
      expect(prisma.punishmentRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { participantId: "p2" },
          create: expect.objectContaining({
            isPunished: false,
          }),
        }),
      );

      // Verify audit entry
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionType: "CHALLENGE_LOCKED",
          targetEntityId: "chal-1",
        }),
      });
    });

    it("rejects finalizing if challenge is not ACTIVE", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        status: "UPCOMING",
        participants: [],
      } as any);

      await expect(finalizeChallenge("chal-1", actor)).rejects.toThrow(
        InvalidLifecycleTransitionError,
      );
    });
  });

  describe("enrollParticipant", () => {
    it("enrolls participant into team and records audit log", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "u1" } as any);
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        teams: [{ id: "t1", name: "Bees", maxMembers: null }],
      } as any);
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.challengeParticipant.create).mockResolvedValueOnce({
        id: "part-1",
        userId: "u1",
        teamId: "t1",
      } as any);

      const result = await enrollParticipant(
        { challengeId: "chal-1", userId: "u1", teamId: "t1", targetSeconds: 36000 },
        actor,
      );

      expect(result.id).toBe("part-1");
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionType: "PARTICIPANT_ENROLLED",
          targetEntityId: "part-1",
        }),
      });
    });

    it("rejects duplicate enrollment", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "u1" } as any);
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        teams: [{ id: "t1", name: "Bees", maxMembers: null }],
      } as any);
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
        id: "part-existing",
      } as any);

      await expect(
        enrollParticipant(
          { challengeId: "chal-1", userId: "u1", teamId: "t1" },
          actor,
        ),
      ).rejects.toThrow("User is already enrolled in this challenge.");
    });

    it("enforces maxMembers capacity constraint", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "u2" } as any);
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        teams: [{ id: "t1", name: "Duo Slot", maxMembers: 2 }],
      } as any);
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.challengeParticipant.count).mockResolvedValueOnce(2); // already full

      await expect(
        enrollParticipant(
          { challengeId: "chal-1", userId: "u2", teamId: "t1" },
          actor,
        ),
      ).rejects.toThrow('Team "Duo Slot" has reached its maximum capacity of 2 member(s).');
    });
  });

  describe("renameDuoTeam", () => {
    it("renames team and writes DUO_RENAMED audit log", async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValueOnce({
        id: "t1",
        name: "Old Name",
      } as any);
      vi.mocked(prisma.team.update).mockResolvedValueOnce({
        id: "t1",
        name: "Midnight Chai",
      } as any);

      const updated = await renameDuoTeam("t1", "Midnight Chai", actor);
      expect(updated.name).toBe("Midnight Chai");

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionType: "DUO_RENAMED",
          targetEntityId: "t1",
          previousValue: JSON.stringify({ name: "Old Name" }),
          newValue: JSON.stringify({ name: "Midnight Chai" }),
        }),
      });
    });
  });
});

