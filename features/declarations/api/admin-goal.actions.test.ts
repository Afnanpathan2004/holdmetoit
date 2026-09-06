import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  adminAddGoalAction,
  adminEditGoalAction,
  adminToggleGoalAction,
} from "./admin-goal.actions";
import * as requireAdminModule from "@/features/auth/api/require-admin";
import * as weeklyGoalRepo from "@/features/declarations/data/weekly-goal.repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/api/require-admin", () => ({
  requireAdminOrHost: vi.fn(),
  AdminAccessError: class AdminAccessError extends Error {},
}));

vi.mock("@/features/declarations/data/weekly-goal.repository", () => ({
  adminEditGoal: vi.fn(),
  adminToggleGoalCompletion: vi.fn(),
  adminAddGoal: vi.fn(),
}));

describe("admin-goal.actions", () => {
  const mockAdmin = { id: "admin-1", username: "host_alex", role: "ADMIN" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminModule.requireAdminOrHost).mockResolvedValue(mockAdmin as any);
  });

  describe("adminEditGoalAction", () => {
    it("edits goal description with reason", async () => {
      vi.mocked(weeklyGoalRepo.adminEditGoal).mockResolvedValueOnce({
        id: "goal-1",
      } as any);

      const result = await adminEditGoalAction({
        challengeId: "chal-1",
        goalId: "goal-1",
        description: "Updated Chapter 4 to 5",
        reason: "Syllabus shifted",
      });

      expect(result).toEqual({ ok: true, goalId: "goal-1" });
      expect(weeklyGoalRepo.adminEditGoal).toHaveBeenCalledWith({
        challengeId: "chal-1",
        goalId: "goal-1",
        description: "Updated Chapter 4 to 5",
        reason: "Syllabus shifted",
        actor: { id: "admin-1", username: "host_alex" },
      });
    });

    it("rejects edit when reason is too short", async () => {
      const result = await adminEditGoalAction({
        challengeId: "chal-1",
        goalId: "goal-1",
        description: "Updated",
        reason: "no",
      });

      expect(result.ok).toBe(false);
      expect(weeklyGoalRepo.adminEditGoal).not.toHaveBeenCalled();
    });
  });

  describe("adminToggleGoalAction", () => {
    it("toggles goal completion with reason", async () => {
      vi.mocked(weeklyGoalRepo.adminToggleGoalCompletion).mockResolvedValueOnce({
        id: "goal-1",
      } as any);

      const result = await adminToggleGoalAction({
        challengeId: "chal-1",
        goalId: "goal-1",
        completed: true,
        reason: "Verified submission manually",
      });

      expect(result).toEqual({ ok: true, goalId: "goal-1" });
      expect(weeklyGoalRepo.adminToggleGoalCompletion).toHaveBeenCalledWith({
        challengeId: "chal-1",
        goalId: "goal-1",
        completed: true,
        reason: "Verified submission manually",
        actor: { id: "admin-1", username: "host_alex" },
      });
    });
  });

  describe("adminAddGoalAction", () => {
    it("adds a new goal with reason", async () => {
      vi.mocked(weeklyGoalRepo.adminAddGoal).mockResolvedValueOnce({
        id: "goal-new",
      } as any);

      const result = await adminAddGoalAction({
        challengeId: "chal-1",
        participantId: "part-1",
        description: "Additional homework assignment",
        reason: "Professor assigned bonus problem set",
      });

      expect(result).toEqual({ ok: true, goalId: "goal-new" });
      expect(weeklyGoalRepo.adminAddGoal).toHaveBeenCalledWith({
        challengeId: "chal-1",
        participantId: "part-1",
        description: "Additional homework assignment",
        reason: "Professor assigned bonus problem set",
        actor: { id: "admin-1", username: "host_alex" },
      });
    });
  });
});

