import { beforeEach, describe, expect, it, vi } from "vitest";

import { areDeclarationsLocked } from "@/features/declarations/domain/declaration-lock";
import { parseDurationToSeconds, formatSecondsToClock } from "@/features/study-logs/domain/duration";
import {
  kickoffChallenge,
  ChallengeValidationError,
} from "@/features/challenges/data/admin-challenge.repository";
import { saveDeclarationsAction } from "@/features/declarations/api/declaration.actions";
import * as requireSessionModule from "@/features/auth/api/require-session";
import * as requireParticipantModule from "@/features/auth/api/require-participant";
import * as weeklyGoalRepo from "@/features/declarations/data/weekly-goal.repository";
import { prisma as basePrisma } from "@/core/db";

const prisma = basePrisma as any;

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/api/require-session", () => ({
  AuthError: class AuthError extends Error {},
  requireSessionUser: vi.fn(),
}));

vi.mock("@/features/auth/api/require-participant", () => ({
  ParticipantAccessError: class ParticipantAccessError extends Error {
    readonly code = "NOT_ENROLLED";
  },
  requireOwnedParticipant: vi.fn(),
}));

vi.mock("@/features/declarations/data/weekly-goal.repository", () => ({
  replaceWeeklyGoals: vi.fn(),
  setWeeklyGoalCompleted: vi.fn(),
  updateParticipantTargetSeconds: vi.fn(),
}));

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
    weeklyGoal: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Journey J3: Pre-Kickoff Declarations & Goal Locking (Law L6 & Law L8)", () => {
  const actor = { id: "host-1", username: "host_alex" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("J3.1: Duration Parsing & Second-Level Clock Precision (Law L8)", () => {
    it("parses clock strings into exact integer seconds without floating-point drift", () => {
      // 35 hours = 126,000 seconds
      expect(parseDurationToSeconds("35:00:00")).toBe(126000);
      expect(formatSecondsToClock(126000)).toBe("35:00:00");

      // 4 hours 33 minutes 20 seconds = 16,400 seconds
      expect(parseDurationToSeconds("04:33:20")).toBe(16400);
      expect(formatSecondsToClock(16400)).toBe("04:33:20");
    });

    it("rejects invalid clock strings and negative durations", () => {
      expect(() => parseDurationToSeconds("invalid")).toThrow();
      expect(() => parseDurationToSeconds("-05:00:00")).toThrow();
    });
  });

  describe("J3.2: Pre-Kickoff Declaration Validation & Submission", () => {
    it("allows enrolled participant to save declarations while challenge is UPCOMING", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
        id: "usr_1",
      } as any);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValueOnce({
        id: "part_1",
        challenge: { status: "UPCOMING" },
      } as any);

      const result = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "35:00:00",
        goals: ["Finish Physics Ch 1-3", "Solve 50 Calculus problems", "Review Organic Chemistry"],
      });

      expect(result.ok).toBe(true);
      expect(weeklyGoalRepo.updateParticipantTargetSeconds).toHaveBeenCalledWith(
        "part_1",
        126000,
      );
      expect(weeklyGoalRepo.replaceWeeklyGoals).toHaveBeenCalledWith("part_1", [
        "Finish Physics Ch 1-3",
        "Solve 50 Calculus problems",
        "Review Organic Chemistry",
      ]);
    });

    it("rejects declarations with fewer than 1 goal or more than 10 goals", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
        id: "usr_1",
      } as any);

      // 0 goals (rejected by Zod schema .min(1))
      const zeroGoals = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "20:00:00",
        goals: [],
      });
      expect(zeroGoals.ok).toBe(false);
      if (!zeroGoals.ok) {
        expect(zeroGoals.code).toBe("INVALID_INPUT");
      }

      // 11 goals (rejected by Zod schema .max(10))
      const elevenGoals = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "20:00:00",
        goals: Array.from({ length: 11 }, (_, i) => `Goal ${i + 1}`),
      });
      expect(elevenGoals.ok).toBe(false);
      if (!elevenGoals.ok) {
        expect(elevenGoals.code).toBe("INVALID_INPUT");
      }
    });

    it("rejects declarations where target hours are outside the 1 to 105 hours range", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
        id: "usr_1",
      } as any);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
        id: "part_1",
        challenge: { status: "UPCOMING" },
      } as any);

      // Under 1 hour (e.g. 00:30:00 = 1800s)
      const underOneHour = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "00:30:00",
        goals: ["Goal 1"],
      });
      expect(underOneHour.ok).toBe(false);
      if (!underOneHour.ok) {
        expect(underOneHour.code).toBe("TARGET_TOO_LOW");
      }

      // Over 105 hours (e.g. 110:00:00)
      const overMax = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "110:00:00",
        goals: ["Goal 1"],
      });
      expect(overMax.ok).toBe(false);
      if (!overMax.ok) {
        expect(overMax.code).toBe("TARGET_TOO_HIGH");
      }
    });
  });

  describe("J3.3: Kickoff Prerequisites & Permanent Declaration Locking", () => {
    it("prevents kickoff if challenge has no participants enrolled", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        title: "Test Chal",
        status: "UPCOMING",
        teams: [{ id: "team-1" }],
        participants: [], // zero participants
      } as any);

      await expect(kickoffChallenge("chal-1", actor)).rejects.toThrow(
        /at least one participant must be enrolled/,
      );
    });

    it("prevents kickoff if challenge has no teams configured", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        title: "Test Chal",
        status: "UPCOMING",
        teams: [], // zero teams
        participants: [{ id: "part-1" }],
      } as any);

      await expect(kickoffChallenge("chal-1", actor)).rejects.toThrow(
        /at least one team must be configured/,
      );
    });

    it("successfully kicks off challenge when prerequisites are met and transitions UPCOMING -> ACTIVE", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        title: "Bees vs Butterflies",
        status: "UPCOMING",
        teams: [{ id: "team-1" }, { id: "team-2" }],
        participants: [
          { id: "part-1", targetSeconds: 126000, user: { name: "Alice" } },
          { id: "part-2", targetSeconds: 144000, user: { name: "Bob" } },
        ],
      } as any);

      vi.mocked(prisma.challenge.update).mockResolvedValueOnce({
        id: "chal-1",
        status: "ACTIVE",
      } as any);

      const result = await kickoffChallenge("chal-1", actor);
      expect(result.status).toBe("ACTIVE");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionType: "CHALLENGE_KICKOFF",
            targetEntityId: "chal-1",
          }),
        }),
      );
    });

    it("locks participant declaration modifications once challenge becomes ACTIVE", async () => {
      expect(areDeclarationsLocked("UPCOMING")).toBe(false);
      expect(areDeclarationsLocked("ACTIVE")).toBe(true);
      expect(areDeclarationsLocked("COMPLETED")).toBe(true);

      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
        id: "usr_1",
      } as any);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValueOnce({
        id: "part_1",
        challenge: { status: "ACTIVE" }, // already ACTIVE!
      } as any);

      const result = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "40:00:00",
        goals: ["Attempted sneaky edit"],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("DECLARATIONS_LOCKED");
        expect(result.message).toMatch(/locked after event kickoff/i);
      }
    });
  });
});
