import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  saveDeclarationsAction,
  toggleWeeklyGoalAction,
} from "@/features/declarations/api/declaration.actions";
import * as requireSessionModule from "@/features/auth/api/require-session";
import * as requireParticipantModule from "@/features/auth/api/require-participant";
import * as weeklyGoalRepo from "@/features/declarations/data/weekly-goal.repository";

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

describe("declaration.actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveDeclarationsAction", () => {
    it("saves declarations when challenge is in UPCOMING state", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
        id: "usr_1",
      } as never);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
        id: "part_1",
        challenge: { status: "UPCOMING" },
      } as never);

      const result = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "35:00:00",
        goals: ["Finish chapter 1", "Finish chapter 2"],
      });

      expect(result).toEqual({ ok: true });
      expect(weeklyGoalRepo.updateParticipantTargetSeconds).toHaveBeenCalledWith(
        "part_1",
        126_000,
      );
      expect(weeklyGoalRepo.replaceWeeklyGoals).toHaveBeenCalledWith("part_1", [
        "Finish chapter 1",
        "Finish chapter 2",
      ]);
    });

    it("rejects declaration edits when challenge is already ACTIVE (locked)", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
        id: "usr_1",
      } as never);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
        id: "part_1",
        challenge: { status: "ACTIVE" },
      } as never);

      const result = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "35:00:00",
        goals: ["Finish chapter 1"],
      });

      expect(result).toEqual({
        ok: false,
        code: "DECLARATIONS_LOCKED",
        message: "Declarations are locked after event kickoff.",
      });
      expect(weeklyGoalRepo.replaceWeeklyGoals).not.toHaveBeenCalled();
    });

    it("rejects declaration edits when challenge is COMPLETED (locked)", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
        id: "usr_1",
      } as never);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
        id: "part_1",
        challenge: { status: "COMPLETED" },
      } as never);

      const result = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "35:00:00",
        goals: ["Finish chapter 1"],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("DECLARATIONS_LOCKED");
      }
    });

    it("rejects invalid target hours format or range", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
        id: "usr_1",
      } as never);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
        id: "part_1",
        challenge: { status: "UPCOMING" },
      } as never);

      const result = await saveDeclarationsAction({
        challengeId: "chal_1",
        targetClock: "00:15:00", // below 1 hour minimum
        goals: ["Finish chapter 1"],
      });

      expect(result).toEqual({
        ok: false,
        code: "TARGET_TOO_LOW",
        message: "Weekly target must be at least 1 hour.",
      });
    });
  });

  describe("toggleWeeklyGoalAction", () => {
    it("updates goal completion during ACTIVE challenges", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
        id: "usr_1",
      } as never);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
        id: "part_1",
        challenge: { status: "ACTIVE" },
      } as never);

      vi.mocked(weeklyGoalRepo.setWeeklyGoalCompleted).mockResolvedValue({
        id: "goal_1",
        completed: true,
      } as never);

      const result = await toggleWeeklyGoalAction({
        challengeId: "chal_1",
        goalId: "goal_1",
        completed: true,
      });

      expect(result).toEqual({ ok: true });
      expect(weeklyGoalRepo.setWeeklyGoalCompleted).toHaveBeenCalledWith(
        "part_1",
        "goal_1",
        true,
      );
    });

    it("rejects goal toggle before kickoff (UPCOMING)", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
        id: "usr_1",
      } as never);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
        id: "part_1",
        challenge: { status: "UPCOMING" },
      } as never);

      const result = await toggleWeeklyGoalAction({
        challengeId: "chal_1",
        goalId: "goal_1",
        completed: true,
      });

      expect(result).toEqual({
        ok: false,
        code: "GOALS_LOCKED",
        message: "Goal completion can only be updated during active challenges.",
      });
    });

    it("rejects goal toggle when goal is not owned by the participant", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
        id: "usr_1",
      } as never);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
        id: "part_1",
        challenge: { status: "ACTIVE" },
      } as never);

      vi.mocked(weeklyGoalRepo.setWeeklyGoalCompleted).mockResolvedValue(null);

      const result = await toggleWeeklyGoalAction({
        challengeId: "chal_1",
        goalId: "goal_other",
        completed: true,
      });

      expect(result).toEqual({
        ok: false,
        code: "GOAL_NOT_FOUND",
        message: "That goal could not be found.",
      });
    });
  });
});

