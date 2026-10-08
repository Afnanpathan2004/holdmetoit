import { prisma } from "@/core/db";
import { compactMutationQueue } from "@/features/tasks/domain/task-sync.schema";
import type {
   BatchSyncResponse,
   QueuedMutation,
} from "@/features/tasks/domain/task-sync.types";
import {
   DEFAULT_CATEGORY_NAME,
   getUserCategorizedTasks,
} from "@/features/tasks/data/task.repository";
import type { TaskStatus, TaskType } from "@prisma/client";

export async function processBatchSync(
   userId: string,
   rawMutations: QueuedMutation[]
): Promise<BatchSyncResponse> {
   const mutations = compactMutationQueue(rawMutations);
   const processedMutationIds: string[] = [];

   await prisma.$transaction(async (tx) => {
      for (const m of mutations) {
         try {
            if (m.entityType === "CATEGORY") {
               const payload = m.payload as Record<string, unknown>;
               const catId = String(payload.id || payload.categoryId || "");
               const explicitName =
                  typeof payload.name === "string" && payload.name.trim() !== ""
                     ? payload.name.trim()
                     : undefined;
               const taskType: TaskType =
                  payload.taskType === "WEEKLY" ? "WEEKLY" : "DAILY";

               if (m.action === "CREATE") {
                  if (catId && explicitName) {
                     const existing = await tx.category.findFirst({
                        where: {
                           OR: [
                              { id: catId },
                              { userId, name: explicitName, taskType },
                           ],
                        },
                     });

                     if (existing) {
                        if (existing.name !== explicitName) {
                           await tx.category.update({
                              where: { id: existing.id },
                              data: { name: explicitName },
                           });
                        }
                     } else {
                        await tx.category.create({
                           data: {
                              id: catId,
                              userId,
                              name: explicitName,
                              taskType,
                           },
                        });
                     }
                  }
               } else if (m.action === "UPDATE" || m.action === "MOVE") {
                  const dataToUpdate: Record<string, unknown> = {};
                  if (explicitName) {
                     dataToUpdate.name = explicitName;
                  }
                  if (typeof payload.sortOrder === "number") {
                     dataToUpdate.sortOrder = payload.sortOrder;
                  }

                  if (catId) {
                     // When moving across columns (taskType specified), prevent unique constraint collisions
                     if (payload.taskType) {
                        const currentCat = await tx.category.findUnique({
                           where: { id: catId },
                        });

                        if (currentCat) {
                           const targetName = explicitName || currentCat.name;
                           if (currentCat.taskType !== taskType) {
                              const nameCollision = await tx.category.findFirst(
                                 {
                                    where: {
                                       userId,
                                       taskType,
                                       name: targetName,
                                       id: { not: catId },
                                    },
                                 }
                              );

                              if (nameCollision) {
                                 dataToUpdate.name = `${targetName} (Moved)`;
                              } else if (explicitName) {
                                 dataToUpdate.name = explicitName;
                              }
                              dataToUpdate.taskType = taskType;
                           }
                        }
                     }

                     if (Object.keys(dataToUpdate).length > 0) {
                        await tx.category.updateMany({
                           where: { id: catId, userId },
                           data: dataToUpdate,
                        });

                        // If taskType changed, cascade to all tasks in this category
                        if (payload.taskType) {
                           await tx.task.updateMany({
                              where: { categoryId: catId, userId },
                              data: { taskType },
                           });
                        }
                     }
                  }
               } else if (m.action === "REORDER") {
                  const categoryIds = (payload.categoryIds as string[]) || [];
                  for (let i = 0; i < categoryIds.length; i++) {
                     await tx.category.updateMany({
                        where: { id: categoryIds[i], userId },
                        data: { sortOrder: i },
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
               const sortOrder =
                  typeof payload.sortOrder === "number" ? payload.sortOrder : 0;

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
                                 sortOrder: 0,
                              },
                           });
                        }
                        categoryId = cat.id;
                     }

                     const status: TaskStatus =
                        (payload.status as TaskStatus) ||
                        (isComplete ? "COMPLETED" : "TODO");
                     const finalIsComplete = status === "COMPLETED";
                     const dueDate = payload.dueDate
                        ? new Date(String(payload.dueDate))
                        : null;

                     await tx.task.upsert({
                        where: { id: taskId },
                        update: {
                           title,
                           isComplete: finalIsComplete,
                           status,
                           dueDate,
                           completedAt: finalIsComplete ? new Date() : null,
                           categoryId,
                           sortOrder,
                        },
                        create: {
                           id: taskId,
                           userId,
                           categoryId,
                           title,
                           taskType,
                           sortOrder,
                           isComplete: finalIsComplete,
                           status,
                           dueDate,
                           completedAt: finalIsComplete ? new Date() : null,
                        },
                     });
                  }
               } else if (m.action === "UPDATE" || m.action === "MOVE") {
                  if (taskId) {
                     const dataToUpdate: Record<string, unknown> = {};
                     if (title) dataToUpdate.title = title;
                     if (categoryId) dataToUpdate.categoryId = categoryId;
                     if (payload.taskType) dataToUpdate.taskType = taskType;
                     if (typeof payload.sortOrder === "number")
                        dataToUpdate.sortOrder = payload.sortOrder;
                     if (payload.dueDate !== undefined) {
                        dataToUpdate.dueDate = payload.dueDate
                           ? new Date(String(payload.dueDate))
                           : null;
                     }
                     if (payload.status) {
                        const status = payload.status as TaskStatus;
                        dataToUpdate.status = status;
                        dataToUpdate.isComplete = status === "COMPLETED";
                        dataToUpdate.completedAt =
                           status === "COMPLETED" ? new Date() : null;
                     } else if (typeof payload.isComplete === "boolean") {
                        dataToUpdate.isComplete = payload.isComplete;
                        dataToUpdate.status = payload.isComplete
                           ? "COMPLETED"
                           : "TODO";
                        dataToUpdate.completedAt = payload.isComplete
                           ? new Date()
                           : null;
                     }

                     await tx.task.updateMany({
                        where: { id: taskId, userId },
                        data: dataToUpdate,
                     });
                  }
               } else if (m.action === "REORDER") {
                  const taskIds = (payload.taskIds as string[]) || [];
                  for (let i = 0; i < taskIds.length; i++) {
                     await tx.task.updateMany({
                        where: { id: taskIds[i], userId },
                        data: { sortOrder: i },
                     });
                  }
               } else if (m.action === "TOGGLE") {
                  if (taskId) {
                     const status: TaskStatus =
                        (payload.status as TaskStatus) ||
                        (isComplete ? "COMPLETED" : "TODO");
                     const finalIsComplete = status === "COMPLETED";

                     await tx.task.updateMany({
                        where: { id: taskId, userId },
                        data: {
                           isComplete: finalIsComplete,
                           status,
                           completedAt: finalIsComplete ? new Date() : null,
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

   // Acknowledge compacted mutations that were completely pruned from rawMutations
   const activeMutationIds = new Set(mutations.map((m) => m.id));
   for (const raw of rawMutations) {
      if (
         !activeMutationIds.has(raw.id) &&
         !processedMutationIds.includes(raw.id)
      ) {
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
