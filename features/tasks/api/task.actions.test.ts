import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError } from "@/features/auth/api/require-session";
import {
  createCategoryAction,
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
} from "./task.actions";
import * as taskRepo from "@/features/tasks/data/task.repository";
import * as sessionModule from "@/features/auth/api/require-session";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/api/require-session", () => ({
  AuthError: class AuthError extends Error {},
  requireSessionUser: vi.fn(),
}));

vi.mock("@/features/tasks/data/task.repository", () => ({
  createTask: vi.fn(),
  toggleTask: vi.fn(),
  deleteTask: vi.fn(),
  createCategory: vi.fn(),
}));

describe("task.actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTaskAction", () => {
    it("creates task when session user is present and input is valid", async () => {
      vi.mocked(sessionModule.requireSessionUser).mockResolvedValue({
        id: "user_1",
      } as never);
      vi.mocked(taskRepo.createTask).mockResolvedValue({
        id: "t_1",
        title: "Study notes",
      } as never);

      const result = await createTaskAction({
        title: "Study notes",
        taskType: "DAILY",
        categoryId: "cat_1",
      });

      expect(result.ok).toBe(true);
      expect(taskRepo.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user_1",
          title: "Study notes",
          taskType: "DAILY",
          categoryId: "cat_1",
        }),
      );
    });

    it("returns UNAUTHORIZED when no session", async () => {
      vi.mocked(sessionModule.requireSessionUser).mockRejectedValue(
        new AuthError("Sign in required."),
      );

      const result = await createTaskAction({
        title: "Study notes",
        taskType: "DAILY",
        categoryId: "cat_1",
      });

      expect(result.ok).toBe(false);
      expect(result.code).toBe("UNAUTHORIZED");
    });

    it("returns INVALID_INPUT when validation fails", async () => {
      vi.mocked(sessionModule.requireSessionUser).mockResolvedValue({
        id: "user_1",
      } as never);

      const result = await createTaskAction({
        title: "   ",
        taskType: "DAILY",
        categoryId: "cat_1",
      });

      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_INPUT");
    });
  });

  describe("toggleTaskAction", () => {
    it("toggles task completion successfully", async () => {
      vi.mocked(sessionModule.requireSessionUser).mockResolvedValue({
        id: "user_1",
      } as never);
      vi.mocked(taskRepo.toggleTask).mockResolvedValue({
        id: "t_1",
        isComplete: true,
      } as never);

      const result = await toggleTaskAction({
        taskId: "t_1",
        isComplete: true,
      });

      expect(result.ok).toBe(true);
      expect(taskRepo.toggleTask).toHaveBeenCalledWith({
        taskId: "t_1",
        userId: "user_1",
        isComplete: true,
      });
    });

    it("returns NOT_FOUND if task does not belong to user", async () => {
      vi.mocked(sessionModule.requireSessionUser).mockResolvedValue({
        id: "user_1",
      } as never);
      vi.mocked(taskRepo.toggleTask).mockResolvedValue(null);

      const result = await toggleTaskAction({
        taskId: "t_other",
        isComplete: true,
      });

      expect(result.ok).toBe(false);
      expect(result.code).toBe("NOT_FOUND");
    });
  });

  describe("deleteTaskAction", () => {
    it("deletes task successfully", async () => {
      vi.mocked(sessionModule.requireSessionUser).mockResolvedValue({
        id: "user_1",
      } as never);
      vi.mocked(taskRepo.deleteTask).mockResolvedValue({ id: "t_1" } as never);

      const result = await deleteTaskAction({
        taskId: "t_1",
      });

      expect(result.ok).toBe(true);
    });
  });

  describe("createCategoryAction", () => {
    it("creates category successfully", async () => {
      vi.mocked(sessionModule.requireSessionUser).mockResolvedValue({
        id: "user_1",
      } as never);
      vi.mocked(taskRepo.createCategory).mockResolvedValue({
        id: "cat_1",
        name: "History",
      } as never);

      const result = await createCategoryAction({
        name: "History",
      });

      expect(result.ok).toBe(true);
      expect(taskRepo.createCategory).toHaveBeenCalledWith({
        userId: "user_1",
        name: "History",
      });
    });
  });
});
