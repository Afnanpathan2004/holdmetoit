import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/core/db";
import {
  createCategory,
  createTask,
  deleteTask,
  getUserCategorizedTasks,
  toggleTask,
} from "./task.repository";

vi.mock("@/core/db", () => {
  const mockPrisma = {
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    task: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("task.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserCategorizedTasks", () => {
    it("returns categorized daily and weekly tasks", async () => {
      const mockCategories = [
        {
          id: "cat_1",
          userId: "user_1",
          name: "Academics",
          createdAt: new Date("2026-10-01"),
          updatedAt: new Date("2026-10-01"),
          tasks: [
            {
              id: "t_1",
              userId: "user_1",
              categoryId: "cat_1",
              title: "Daily math review",
              taskType: "DAILY",
              isComplete: true,
              createdAt: new Date("2026-10-01"),
              updatedAt: new Date("2026-10-01"),
              completedAt: new Date("2026-10-01"),
            },
            {
              id: "t_2",
              userId: "user_1",
              categoryId: "cat_1",
              title: "Weekly physics problem set",
              taskType: "WEEKLY",
              isComplete: false,
              createdAt: new Date("2026-10-01"),
              updatedAt: new Date("2026-10-01"),
              completedAt: null,
            },
          ],
        },
      ];

      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never);

      const result = await getUserCategorizedTasks("user_1");

      expect(result.categories).toHaveLength(1);
      expect(result.dailyCategories[0].tasks).toHaveLength(1);
      expect(result.dailyCategories[0].tasks[0].title).toBe("Daily math review");
      expect(result.weeklyCategories[0].tasks).toHaveLength(1);
      expect(result.weeklyCategories[0].tasks[0].title).toBe("Weekly physics problem set");
      expect(result.totalDailyTasks).toBe(1);
      expect(result.completedDailyTasks).toBe(1);
      expect(result.totalWeeklyTasks).toBe(1);
      expect(result.completedWeeklyTasks).toBe(0);
    });

    it("seeds default Category 1 if user has no categories", async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.category.create).mockResolvedValue({
        id: "cat_default",
        userId: "user_new",
        name: "Category 1",
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [],
      } as never);

      const result = await getUserCategorizedTasks("user_new");

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user_new",
            name: "Category 1",
          }),
        }),
      );
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe("Category 1");
    });
  });

  describe("createTask", () => {
    it("creates a task in existing category", async () => {
      const mockCreated = {
        id: "task_new",
        userId: "user_1",
        categoryId: "cat_1",
        title: "Read Chapter 5",
        taskType: "DAILY",
        isComplete: false,
      };

      vi.mocked(prisma.task.create).mockResolvedValue(mockCreated as never);

      const result = await createTask({
        userId: "user_1",
        title: "Read Chapter 5",
        taskType: "DAILY",
        categoryId: "cat_1",
      });

      expect(result).toEqual(mockCreated);
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Read Chapter 5",
            taskType: "DAILY",
            categoryId: "cat_1",
          }),
        }),
      );
    });

    it("creates new category if newCategoryName is specified", async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.category.create).mockResolvedValue({
        id: "cat_biology",
        userId: "user_1",
        name: "Biology",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: "task_bio",
        userId: "user_1",
        categoryId: "cat_biology",
        title: "Lab Report",
        taskType: "WEEKLY",
      } as never);

      await createTask({
        userId: "user_1",
        title: "Lab Report",
        taskType: "WEEKLY",
        newCategoryName: "Biology",
      });

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: "user_1", name: "Biology" },
        }),
      );
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoryId: "cat_biology",
          }),
        }),
      );
    });
  });

  describe("toggleTask", () => {
    it("updates task completion and sets completedAt", async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue({
        id: "task_1",
        userId: "user_1",
        isComplete: false,
      } as never);

      vi.mocked(prisma.task.update).mockResolvedValue({
        id: "task_1",
        isComplete: true,
        completedAt: new Date(),
      } as never);

      const result = await toggleTask({
        taskId: "task_1",
        userId: "user_1",
        isComplete: true,
      });

      expect(result).toBeDefined();
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "task_1" },
          data: expect.objectContaining({
            isComplete: true,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("returns null if task not found for user", async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

      const result = await toggleTask({
        taskId: "task_other",
        userId: "user_1",
        isComplete: true,
      });

      expect(result).toBeNull();
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteTask", () => {
    it("deletes task when owned by user", async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue({
        id: "task_del",
        userId: "user_1",
      } as never);
      vi.mocked(prisma.task.delete).mockResolvedValue({ id: "task_del" } as never);

      const result = await deleteTask({
        taskId: "task_del",
        userId: "user_1",
      });

      expect(result).toEqual({ id: "task_del" });
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: "task_del" },
      });
    });
  });

  describe("createCategory", () => {
    it("returns existing category if already present", async () => {
      const existing = { id: "cat_exist", name: "Chemistry" };
      vi.mocked(prisma.category.findFirst).mockResolvedValue(existing as never);

      const result = await createCategory({
        userId: "user_1",
        name: "Chemistry",
      });

      expect(result).toEqual(existing);
      expect(prisma.category.create).not.toHaveBeenCalled();
    });
  });
});
