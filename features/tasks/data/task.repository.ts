import { prisma } from "@/core/db";
import type { TaskType } from "@prisma/client";
import type {
   CategoryGroup,
   CategoryItem,
   TaskItem,
   TaskStatus,
   UserCategorizedTasks,
} from "@/features/tasks/domain/task.types";

function formatUtcDateKey(date: Date): string {
   return date.toISOString().slice(0, 10);
}

export const DEFAULT_CATEGORY_NAME = "General";

export async function getUserCategorizedTasks(
   userId: string
): Promise<UserCategorizedTasks> {
   let categories = await prisma.category.findMany({
      where: { userId },
      include: {
         tasks: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
         },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
   });

   const categoryItems: CategoryItem[] = categories.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      taskType: c.taskType,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
   }));

   const dailyCategories: CategoryGroup[] = categories
      .filter((c) => c.taskType === "DAILY")
      .map((c) => {
         const dailyTasks: TaskItem[] = c.tasks
            .filter((t) => t.taskType === "DAILY")
            .map((t) => ({
               id: t.id,
               userId: t.userId,
               categoryId: t.categoryId,
               title: t.title,
               taskType: "DAILY" as const,
               sortOrder: t.sortOrder,
               isComplete: t.isComplete,
               status:
                  (t.status as TaskStatus) ??
                  (t.isComplete ? "COMPLETED" : "TODO"),
               dueDate: t.dueDate
                  ? formatUtcDateKey(t.dueDate)
                  : formatUtcDateKey(t.createdAt),
               createdAt: t.createdAt,
               updatedAt: t.updatedAt,
               completedAt: t.completedAt,
            }));

         return {
            id: c.id,
            name: c.name,
            taskType: "DAILY" as const,
            sortOrder: c.sortOrder,
            isCollapsed: false,
            tasks: dailyTasks,
         };
      });

   const weeklyCategories: CategoryGroup[] = categories
      .filter((c) => c.taskType === "WEEKLY")
      .map((c) => {
         const weeklyTasks: TaskItem[] = c.tasks
            .filter((t) => t.taskType === "WEEKLY")
            .map((t) => ({
               id: t.id,
               userId: t.userId,
               categoryId: t.categoryId,
               title: t.title,
               taskType: "WEEKLY" as const,
               sortOrder: t.sortOrder,
               isComplete: t.isComplete,
               status:
                  (t.status as TaskStatus) ??
                  (t.isComplete ? "COMPLETED" : "TODO"),
               dueDate: t.dueDate ? formatUtcDateKey(t.dueDate) : null,
               createdAt: t.createdAt,
               updatedAt: t.updatedAt,
               completedAt: t.completedAt,
            }));

         return {
            id: c.id,
            name: c.name,
            taskType: "WEEKLY" as const,
            sortOrder: c.sortOrder,
            isCollapsed: false,
            tasks: weeklyTasks,
         };
      });

   const allTasks = categories.flatMap((c) => c.tasks);
   const dailyAll = allTasks.filter((t) => t.taskType === "DAILY");
   const weeklyAll = allTasks.filter((t) => t.taskType === "WEEKLY");

   return {
      categories: categoryItems,
      dailyCategories,
      weeklyCategories,
      totalDailyTasks: dailyAll.length,
      completedDailyTasks: dailyAll.filter((t) => t.isComplete).length,
      totalWeeklyTasks: weeklyAll.length,
      completedWeeklyTasks: weeklyAll.filter((t) => t.isComplete).length,
   };
}

export async function createTask(params: {
   userId: string;
   title: string;
   taskType: TaskType;
   categoryId?: string;
   newCategoryName?: string;
   isComplete?: boolean;
   status?: TaskStatus;
   dueDate?: string | Date | null;
}) {
   let resolvedCategoryId = params.categoryId;

   if (params.newCategoryName && params.newCategoryName.trim()) {
      const trimmedName = params.newCategoryName.trim();
      const existing = await prisma.category.findFirst({
         where: {
            userId: params.userId,
            taskType: params.taskType,
            name: { equals: trimmedName, mode: "insensitive" },
         },
      });

      if (existing) {
         resolvedCategoryId = existing.id;
      } else {
         const created = await prisma.category.create({
            data: {
               userId: params.userId,
               name: trimmedName,
               taskType: params.taskType,
            },
         });
         resolvedCategoryId = created.id;
      }
   }

   if (!resolvedCategoryId) {
      const fallback = await prisma.category.findFirst({
         where: {
            userId: params.userId,
            taskType: params.taskType,
         },
         orderBy: { createdAt: "asc" },
      });
      if (fallback) {
         resolvedCategoryId = fallback.id;
      } else {
         const created = await prisma.category.create({
            data: {
               userId: params.userId,
               name: DEFAULT_CATEGORY_NAME,
               taskType: params.taskType,
            },
         });
         resolvedCategoryId = created.id;
      }
   }

   const status: TaskStatus =
      params.status ?? (params.isComplete ? "COMPLETED" : "TODO");
   const isComplete = status === "COMPLETED";
   const dueDate = params.dueDate ? new Date(params.dueDate) : null;

   return prisma.task.create({
      data: {
         userId: params.userId,
         categoryId: resolvedCategoryId,
         title: params.title.trim(),
         taskType: params.taskType,
         isComplete,
         status,
         dueDate,
         completedAt: isComplete ? new Date() : null,
      },
      include: {
         category: true,
      },
   });
}

export async function toggleTask(params: {
   taskId: string;
   userId: string;
   isComplete?: boolean;
   status?: TaskStatus;
}) {
   const existing = await prisma.task.findFirst({
      where: {
         id: params.taskId,
         userId: params.userId,
      },
   });

   if (!existing) {
      return null;
   }

   const nextStatus: TaskStatus =
      params.status ??
      (params.isComplete !== undefined
         ? params.isComplete
            ? "COMPLETED"
            : "TODO"
         : existing.isComplete
           ? "TODO"
           : "COMPLETED");
   const nextIsComplete = nextStatus === "COMPLETED";

   return prisma.task.update({
      where: { id: params.taskId },
      data: {
         isComplete: nextIsComplete,
         status: nextStatus,
         completedAt: nextIsComplete ? new Date() : null,
      },
      include: {
         category: true,
      },
   });
}

export async function deleteTask(params: { taskId: string; userId: string }) {
   const existing = await prisma.task.findFirst({
      where: {
         id: params.taskId,
         userId: params.userId,
      },
   });

   if (!existing) {
      return null;
   }

   return prisma.task.delete({
      where: { id: params.taskId },
   });
}

export async function createCategory(params: {
   userId: string;
   name: string;
   taskType?: TaskType;
}) {
   const trimmedName = params.name.trim();
   const taskType = params.taskType ?? "DAILY";
   const existing = await prisma.category.findFirst({
      where: {
         userId: params.userId,
         taskType,
         name: { equals: trimmedName, mode: "insensitive" },
      },
   });

   if (existing) {
      return existing;
   }

   return prisma.category.create({
      data: {
         userId: params.userId,
         name: trimmedName,
         taskType,
      },
   });
}

export async function updateTask(params: {
   taskId: string;
   userId: string;
   title?: string;
   isComplete?: boolean;
   status?: TaskStatus;
   dueDate?: string | Date | null;
}) {
   const existing = await prisma.task.findFirst({
      where: {
         id: params.taskId,
         userId: params.userId,
      },
   });

   if (!existing) {
      return null;
   }

   const dataToUpdate: {
      title?: string;
      isComplete?: boolean;
      status?: TaskStatus;
      dueDate?: Date | null;
      completedAt?: Date | null;
   } = {};

   if (params.title !== undefined) {
      dataToUpdate.title = params.title.trim();
   }
   if (params.status !== undefined) {
      dataToUpdate.status = params.status;
      dataToUpdate.isComplete = params.status === "COMPLETED";
      dataToUpdate.completedAt =
         params.status === "COMPLETED" ? new Date() : null;
   } else if (params.isComplete !== undefined) {
      dataToUpdate.isComplete = params.isComplete;
      dataToUpdate.status = params.isComplete ? "COMPLETED" : "TODO";
      dataToUpdate.completedAt = params.isComplete ? new Date() : null;
   }
   if (params.dueDate !== undefined) {
      dataToUpdate.dueDate = params.dueDate ? new Date(params.dueDate) : null;
   }

   return prisma.task.update({
      where: { id: params.taskId },
      data: dataToUpdate,
      include: {
         category: true,
      },
   });
}

export async function updateCategory(params: {
   categoryId: string;
   userId: string;
   name: string;
}) {
   const existing = await prisma.category.findFirst({
      where: {
         id: params.categoryId,
         userId: params.userId,
      },
   });

   if (!existing) {
      return null;
   }

   const trimmedName = params.name.trim();

   // If name is unchanged, return existing
   if (existing.name.toLowerCase() === trimmedName.toLowerCase()) {
      if (existing.name !== trimmedName) {
         return prisma.category.update({
            where: { id: params.categoryId },
            data: { name: trimmedName },
         });
      }
      return existing;
   }

   // Check if target name is already used by another category of this user in the same taskType
   const duplicate = await prisma.category.findFirst({
      where: {
         userId: params.userId,
         taskType: existing.taskType,
         name: { equals: trimmedName, mode: "insensitive" },
         id: { not: params.categoryId },
      },
   });

   if (duplicate) {
      throw new Error(`Category "${trimmedName}" already exists.`);
   }

   return prisma.category.update({
      where: { id: params.categoryId },
      data: {
         name: trimmedName,
      },
   });
}

export async function deleteCategory(params: {
   categoryId: string;
   userId: string;
}) {
   const existing = await prisma.category.findFirst({
      where: {
         id: params.categoryId,
         userId: params.userId,
      },
   });

   if (!existing) {
      return null;
   }

   return prisma.category.delete({
      where: { id: params.categoryId },
   });
}
