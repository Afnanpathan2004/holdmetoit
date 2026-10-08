import { beforeEach, describe, expect, it, vi } from "vitest";
import { processBatchSync } from "./task-sync.repository";
import { prisma } from "@/core/db";
import * as taskRepo from "./task.repository";

vi.mock("@/core/db", () => ({
   prisma: {
      $transaction: vi.fn(),
      category: {
         findUnique: vi.fn(),
         findFirst: vi.fn(),
         findMany: vi.fn(),
         create: vi.fn(),
         update: vi.fn(),
         updateMany: vi.fn(),
         deleteMany: vi.fn(),
      },
      task: {
         findFirst: vi.fn(),
         upsert: vi.fn(),
         updateMany: vi.fn(),
         deleteMany: vi.fn(),
      },
   },
}));

vi.mock("./task.repository", () => ({
   DEFAULT_CATEGORY_NAME: "General",
   getUserCategorizedTasks: vi.fn(),
}));

describe("processBatchSync (task-sync.repository)", () => {
   const userId = "user_test_123";

   beforeEach(() => {
      vi.clearAllMocks();

      vi.mocked(taskRepo.getUserCategorizedTasks).mockResolvedValue({
         categories: [],
         dailyCategories: [],
         weeklyCategories: [],
         totalDailyTasks: 0,
         completedDailyTasks: 0,
         totalWeeklyTasks: 0,
         completedWeeklyTasks: 0,
      });

      // Mock prisma.$transaction to execute callback with mock tx
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
         return (callback as (tx: unknown) => Promise<unknown>)(prisma);
      });
   });

   it("does not rename category to DEFAULT_CATEGORY_NAME when moving a category without name in payload", async () => {
      const catId = "cat-uuid-123";
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
         id: catId,
         userId,
         name: "Custom Category",
         taskType: "DAILY",
         sortOrder: 0,
         createdAt: new Date(),
         updatedAt: new Date(),
      });

      vi.mocked(prisma.category.findFirst).mockResolvedValue(null); // No collision in WEEKLY

      const res = await processBatchSync(userId, [
         {
            id: "mut-1",
            entityType: "CATEGORY",
            action: "MOVE",
            payload: {
               categoryId: catId,
               taskType: "WEEKLY",
               sortOrder: 1,
            },
            createdAt: Date.now(),
            retryCount: 0,
         },
      ]);

      expect(res.success).toBe(true);
      expect(res.processedMutationIds).toContain("mut-1");

      // Verify updateMany was called WITHOUT name: "Category 1"
      expect(prisma.category.updateMany).toHaveBeenCalledWith({
         where: { id: catId, userId },
         data: {
            sortOrder: 1,
            taskType: "WEEKLY",
         },
      });

      // Verify tasks inside this category are cascaded to target taskType
      expect(prisma.task.updateMany).toHaveBeenCalledWith({
         where: { categoryId: catId, userId },
         data: {
            taskType: "WEEKLY",
         },
      });
   });

   it("disambiguates category name when moving across columns with an existing name collision", async () => {
      const catId = "cat-uuid-daily";
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
         id: catId,
         userId,
         name: "Math",
         taskType: "DAILY",
         sortOrder: 0,
         createdAt: new Date(),
         updatedAt: new Date(),
      });

      // Collision exists in target column
      vi.mocked(prisma.category.findFirst).mockResolvedValue({
         id: "cat-uuid-weekly-math",
         userId,
         name: "Math",
         taskType: "WEEKLY",
         sortOrder: 0,
         createdAt: new Date(),
         updatedAt: new Date(),
      });

      const res = await processBatchSync(userId, [
         {
            id: "mut-2",
            entityType: "CATEGORY",
            action: "MOVE",
            payload: {
               categoryId: catId,
               taskType: "WEEKLY",
               sortOrder: 2,
            },
            createdAt: Date.now(),
            retryCount: 0,
         },
      ]);

      expect(res.success).toBe(true);
      expect(res.processedMutationIds).toContain("mut-2");

      // Verify name was disambiguated to avoid unique constraint failure
      expect(prisma.category.updateMany).toHaveBeenCalledWith({
         where: { id: catId, userId },
         data: {
            name: "Math (Moved)",
            taskType: "WEEKLY",
            sortOrder: 2,
         },
      });
   });

   it("does not acknowledge mutations that throw errors during execution", async () => {
      vi.mocked(prisma.category.updateMany).mockRejectedValueOnce(
         new Error("Database error")
      );

      const res = await processBatchSync(userId, [
         {
            id: "mut-fail-1",
            entityType: "CATEGORY",
            action: "UPDATE",
            payload: {
               categoryId: "cat-fail",
               name: "New Name",
            },
            createdAt: Date.now(),
            retryCount: 0,
         },
      ]);

      expect(res.success).toBe(true);
      expect(res.processedMutationIds).not.toContain("mut-fail-1");
   });
});
