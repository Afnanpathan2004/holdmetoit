import { describe, expect, it } from "vitest";
import {
  createCategorySchema,
  createTaskSchema,
  deleteTaskSchema,
  toggleTaskSchema,
} from "./task.validation";

describe("task.validation", () => {
  describe("createTaskSchema", () => {
    it("accepts valid input with categoryId", () => {
      const result = createTaskSchema.safeParse({
        title: "Study Chapter 4",
        taskType: "DAILY",
        categoryId: "cat_123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid input with newCategoryName", () => {
      const result = createTaskSchema.safeParse({
        title: "Finish physics set",
        taskType: "WEEKLY",
        newCategoryName: "Physics",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty title", () => {
      const result = createTaskSchema.safeParse({
        title: "   ",
        taskType: "DAILY",
        categoryId: "cat_123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects when both categoryId and newCategoryName are missing", () => {
      const result = createTaskSchema.safeParse({
        title: "Review notes",
        taskType: "DAILY",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid taskType", () => {
      const result = createTaskSchema.safeParse({
        title: "Review notes",
        taskType: "MONTHLY",
        categoryId: "cat_123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("toggleTaskSchema", () => {
    it("accepts valid toggle input", () => {
      const result = toggleTaskSchema.safeParse({
        taskId: "task_1",
        isComplete: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty taskId", () => {
      const result = toggleTaskSchema.safeParse({
        taskId: "   ",
        isComplete: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteTaskSchema", () => {
    it("accepts valid taskId", () => {
      const result = deleteTaskSchema.safeParse({
        taskId: "task_abc",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty taskId", () => {
      const result = deleteTaskSchema.safeParse({
        taskId: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createCategorySchema", () => {
    it("accepts valid category name", () => {
      const result = createCategorySchema.safeParse({
        name: "Mathematics",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty category name", () => {
      const result = createCategorySchema.safeParse({
        name: "   ",
      });
      expect(result.success).toBe(false);
    });
  });
});
