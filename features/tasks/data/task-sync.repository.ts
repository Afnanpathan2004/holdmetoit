import { prisma } from "@/core/db";
import {
  compactMutationQueue,
} from "@/features/tasks/domain/task-sync.schema";
import type {
  BatchSyncResponse,
  QueuedMutation,
} from "@/features/tasks/domain/task-sync.types";
import {
  DEFAULT_CATEGORY_NAME,
  getUserCategorizedTasks,
} from "@/features/tasks/data/task.repository";
import type { TaskType } from "@prisma/client";

export async function processBatchSync(
  userId: string,
  rawMutations: QueuedMutation[],
): Promise<BatchSyncResponse> {
  const mutations = compactMutationQueue(rawMutations);
  const processedMutationIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const m of mutations) {
      try {
        if (m.entityType === "CATEGORY") {
          const payload = m.payload as Record<string, unknown>;
          const catId = String(payload.id || payload.categoryId || "");
          const name = String(payload.name || DEFAULT_CATEGORY_NAME).trim();
          const taskType: TaskType =
            payload.taskType === "WEEKLY" ? "WEEKLY" : "DAILY";

          if (m.action === "CREATE") {
            if (catId && name) {
              const existing = await tx.category.findFirst({
                where: {
                  OR: [
                    { id: catId },
                    { userId, name, taskType },
                  ],
                },
              });

              if (existing) {
                if (existing.name !== name) {
                  await tx.category.update({
                    where: { id: existing.id },
                    data: { name },
                  });
                }
              } else {
                await tx.category.create({
                  data: {
                    id: catId,
                    userId,
                    name,
                    taskType,
                  },
                });
              }
            }
          } else if (m.action === "UPDATE") {
            if (catId && name) {
              await tx.category.updateMany({
                where: { id: catId, userId },
                data: { name },
              });
            }
          } else if (m.action === "DELETE") {
            if (catId) {
              await tx.category.deleteMany({
                where: { id: catId, userId },
              });
            }
          }
        } else if (m.entityType === "TASK") {
          const payload = m.payload as Record<string, unknown>;
          const taskId = String(payload.id || payload.taskId || "");
          let categoryId = String(payload.categoryId || "");
          const title = String(payload.title || "").trim();
          const taskType: TaskType =
            payload.taskType === "WEEKLY" ? "WEEKLY" : "DAILY";
          const isComplete = Boolean(payload.isComplete);

          if (m.action === "CREATE") {
            if (taskId && title) {
              // Ensure category exists and belongs to user
              let cat = categoryId
                ? await tx.category.findFirst({
                    where: { id: categoryId, userId },
                  })
                : null;

              if (!cat) {
                cat = await tx.category.findFirst({
                  where: { userId, taskType },
                });
                if (!cat) {
                  cat = await tx.category.create({
                    data: {
                      userId,
                      name: DEFAULT_CATEGORY_NAME,
                      taskType,
                    },
                  });
                }
                categoryId = cat.id;
              }

              await tx.task.upsert({
                where: { id: taskId },
                update: {
                  title,
                  isComplete,
                  completedAt: isComplete ? new Date() : null,
                  categoryId,
                },
                create: {
                  id: taskId,
                  userId,
                  categoryId,
                  title,
                  taskType,
                  isComplete,
                  completedAt: isComplete ? new Date() : null,
                },
              });
            }
          } else if (m.action === "UPDATE") {
            if (taskId && title) {
              await tx.task.updateMany({
                where: { id: taskId, userId },
                data: { title },
              });
            }
          } else if (m.action === "TOGGLE") {
            if (taskId) {
              await tx.task.updateMany({
                where: { id: taskId, userId },
                data: {
                  isComplete,
                  completedAt: isComplete ? new Date() : null,
                },
              });
            }
          } else if (m.action === "DELETE") {
            if (taskId) {
              await tx.task.deleteMany({
                where: { id: taskId, userId },
              });
            }
          }
        }

        processedMutationIds.push(m.id);
      } catch (err) {
        // Individual mutation error: continue processing rest of queue
        console.error(`[TaskSync] Error applying mutation ${m.id}:`, err);
      }
    }
  });

  // Also acknowledge any mutations that were compacted away from rawMutations
  for (const raw of rawMutations) {
    if (!processedMutationIds.includes(raw.id)) {
      processedMutationIds.push(raw.id);
    }
  }

  const latest = await getUserCategorizedTasks(userId);

  const flatTasks = [
    ...latest.dailyCategories.flatMap((c) => c.tasks),
    ...latest.weeklyCategories.flatMap((c) => c.tasks),
  ];

  return {
    success: true,
    processedMutationIds,
    serverChanges: {
      categories: latest.categories,
      tasks: flatTasks,
    },
  };
}
