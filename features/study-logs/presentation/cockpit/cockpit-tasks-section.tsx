"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Trash2,
  MoreVertical,
  Pencil,
  GripVertical,
} from "lucide-react";
import {
  moveCategoryBetweenColumns,
  moveTaskBetweenCategories,
} from "@/features/tasks/domain/task-reorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  captureLogRocketException,
  trackLogRocketEvent,
} from "@/core/observability/logrocket";
import {
  createTaskAction,
  deleteCategoryAction,
  deleteTaskAction,
  toggleTaskAction,
  updateCategoryAction,
  updateTaskAction,
} from "@/features/tasks/api/task.actions";
import type { UserCategorizedTasks } from "@/features/tasks/domain/task.types";
import {
  deleteLocalCategory,
  deleteLocalTask,
  enqueueMutation,
  getAllLocalCategories,
  getAllLocalTasks,
  logTaskSync,
  putLocalCategories,
  putLocalCategory,
  putLocalTask,
  putLocalTasks,
} from "@/features/tasks/data/local/task-idb";
import {
  initTaskSync,
  scheduleSync,
} from "@/features/tasks/data/local/task-sync.service";
import type {
  LocalCategoryRecord,
  LocalTaskRecord,
} from "@/features/tasks/domain/task-sync.types";

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CategoryGroup {
  id?: string;
  name: string;
  isCollapsed: boolean;
  tasks: TaskItem[];
}

export interface CockpitTasksSectionProps {
  isLoggedIn: boolean;
  userId?: string | null;
  userTasks?: UserCategorizedTasks | null;
}

export function CockpitTasksSection({
  isLoggedIn,
  userId,
  userTasks,
}: CockpitTasksSectionProps) {
  const [, startTransition] = useTransition();
  const [addModalType, setAddModalType] = useState<"daily" | "weekly" | null>(null);
  const [newTodoText, setNewTodoText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const categoryInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isCreatingCategory && addModalType) {
      const timer = setTimeout(() => {
        categoryInputRef.current?.focus();
        categoryInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isCreatingCategory, addModalType]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    type: "task" | "category";
    x: number;
    y: number;
    task?: {
      id: string;
      text: string;
      catIdx: number;
      taskType: "daily" | "weekly";
    };
    category?: { id?: string; name: string; taskType: "daily" | "weekly" };
  } | null>(null);

  // Edit Task Modal State
  const [editTaskModal, setEditTaskModal] = useState<{
    id: string;
    text: string;
    catIdx: number;
    taskType: "daily" | "weekly";
  } | null>(null);
  const [editTaskInputText, setEditTaskInputText] = useState("");

  // Edit Category Modal State
  const [editCategoryModal, setEditCategoryModal] = useState<{
    id?: string;
    name: string;
    taskType: "daily" | "weekly";
  } | null>(null);
  const [editCategoryInputName, setEditCategoryInputName] = useState("");

  // Delete Category Confirmation Modal State
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{
    id?: string;
    name: string;
    taskType: "daily" | "weekly";
  } | null>(null);

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<{
    type: "task" | "category";
    id?: string;
    sourceCatIdx: number;
    sourceColumn: "daily" | "weekly";
  } | null>(null);

  const [dragOverInfo, setDragOverInfo] = useState<{
    type: "task" | "category" | "column";
    targetId?: string;
    targetCatIdx?: number;
    targetColumn: "daily" | "weekly";
    position?: "above" | "below";
  } | null>(null);

  const [dailyCategories, setDailyCategories] = useState<CategoryGroup[]>(() => {
    if (userTasks?.dailyCategories && userTasks.dailyCategories.length > 0) {
      return userTasks.dailyCategories.map((c) => ({
        id: c.id,
        name: c.name,
        isCollapsed: false,
        tasks: c.tasks.map((t) => ({
          id: t.id,
          text: t.title,
          completed: t.isComplete,
        })),
      }));
    }
    return [];
  });

  const [weeklyCategories, setWeeklyCategories] = useState<CategoryGroup[]>(() => {
    if (userTasks?.weeklyCategories && userTasks.weeklyCategories.length > 0) {
      return userTasks.weeklyCategories.map((c) => ({
        id: c.id,
        name: c.name,
        isCollapsed: false,
        tasks: c.tasks.map((t) => ({
          id: t.id,
          text: t.title,
          completed: t.isComplete,
        })),
      }));
    }
    return [];
  });

  const dailyCategoryOptions = Array.from(
    new Set([
      ...(userTasks?.categories?.filter((c) => c.taskType === "DAILY").map((c) => c.name) ?? []),
      ...dailyCategories.map((c) => c.name),
    ]),
  );

  const weeklyCategoryOptions = Array.from(
    new Set([
      ...(userTasks?.categories?.filter((c) => c.taskType === "WEEKLY").map((c) => c.name) ?? []),
      ...weeklyCategories.map((c) => c.name),
    ]),
  );

  const dailyCategoryNameToId = new Map(
    userTasks?.categories?.filter((c) => c.taskType === "DAILY").map((c) => [c.name, c.id]) ?? [],
  );

  const weeklyCategoryNameToId = new Map(
    userTasks?.categories?.filter((c) => c.taskType === "WEEKLY").map((c) => [c.name, c.id]) ?? [],
  );

  useEffect(() => {
    const cleanup = initTaskSync(userId);
    let isCancelled = false;

    async function hydrateFromIndexedDB() {
      try {
        const localTasks = await getAllLocalTasks(userId ?? null);
        const localCats = await getAllLocalCategories(userId ?? null);

        if (isCancelled) return;

        if (localCats.length > 0 || localTasks.length > 0) {
          logTaskSync("Hydrated tasks from IndexedDB", {
            cats: localCats.length,
            tasks: localTasks.length,
          });

          const sortedCats = [...localCats].sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
          );
          const sortedTasks = [...localTasks].sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
          );

          const dailyCats = sortedCats
            .filter((c) => c.taskType === "DAILY")
            .map((c) => ({
              id: c.id,
              name: c.name,
              isCollapsed: false,
              tasks: sortedTasks
                .filter((t) => t.categoryId === c.id)
                .map((t) => ({
                  id: t.id,
                  text: t.title,
                  completed: t.isComplete,
                })),
            }));

          const weeklyCats = sortedCats
            .filter((c) => c.taskType === "WEEKLY")
            .map((c) => ({
              id: c.id,
              name: c.name,
              isCollapsed: false,
              tasks: sortedTasks
                .filter((t) => t.categoryId === c.id)
                .map((t) => ({
                  id: t.id,
                  text: t.title,
                  completed: t.isComplete,
                })),
            }));

          if (dailyCats.length > 0) {
            setDailyCategories(dailyCats);
          }
          if (weeklyCats.length > 0) {
            setWeeklyCategories(weeklyCats);
          }
        } else if (userTasks && userTasks.categories.length > 0) {
          logTaskSync("Seeding IndexedDB from server userTasks...");
          const seedCats: LocalCategoryRecord[] = userTasks.categories.map((c) => ({
            id: c.id,
            userId: userId || null,
            name: c.name,
            taskType: c.taskType,
            createdAt: new Date(c.createdAt).toISOString(),
            updatedAt: new Date(c.updatedAt).toISOString(),
            syncState: "synced",
          }));

          const seedTasks: LocalTaskRecord[] = [
            ...userTasks.dailyCategories.flatMap((c) => c.tasks),
            ...userTasks.weeklyCategories.flatMap((c) => c.tasks),
          ].map((t) => ({
            id: t.id,
            userId: userId || null,
            categoryId: t.categoryId,
            title: t.title,
            taskType: t.taskType,
            isComplete: t.isComplete,
            createdAt: new Date(t.createdAt).toISOString(),
            updatedAt: new Date(t.updatedAt).toISOString(),
            completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
            syncState: "synced",
          }));

          await putLocalCategories(seedCats);
          await putLocalTasks(seedTasks);
        }
      } catch (err) {
        logTaskSync("Error hydrating from IndexedDB:", err);
      }
    }

    hydrateFromIndexedDB();

    return () => {
      isCancelled = true;
      cleanup();
    };
  }, [userId, userTasks]);

  const toggleDailyCollapse = (index: number) => {
    setDailyCategories((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, isCollapsed: !cat.isCollapsed } : cat
      )
    );
  };

  const toggleWeeklyCollapse = (index: number) => {
    setWeeklyCategories((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, isCollapsed: !cat.isCollapsed } : cat
      )
    );
  };

  const toggleDailyTask = (catIndex: number, taskId: string) => {
    const targetTask = dailyCategories[catIndex]?.tasks.find((t) => t.id === taskId);
    if (!targetTask) return;
    const nextCompleted = !targetTask.completed;

    setDailyCategories((prev) =>
      prev.map((cat, i) =>
        i === catIndex
          ? {
              ...cat,
              tasks: cat.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: nextCompleted } : t
              ),
            }
          : cat
      )
    );

    const nowIso = new Date().toISOString();
    const cat = dailyCategories[catIndex];
    if (cat?.id) {
      putLocalTask({
        id: taskId,
        userId: userId ?? null,
        categoryId: cat.id,
        title: targetTask.text,
        taskType: "DAILY",
        isComplete: nextCompleted,
        createdAt: nowIso,
        updatedAt: nowIso,
        completedAt: nextCompleted ? nowIso : null,
        syncState: "pending",
      }).catch(() => {});
    }

    if (isLoggedIn && userId) {
      enqueueMutation({
        id: crypto.randomUUID(),
        entityType: "TASK",
        action: "TOGGLE",
        payload: { taskId, isComplete: nextCompleted },
        createdAt: Date.now(),
        retryCount: 0,
      })
        .then(() => {
          scheduleSync(userId);
        })
        .catch(() => {});

      trackLogRocketEvent("TaskToggled", {
        taskId,
        taskType: "daily",
        isComplete: nextCompleted,
      });
    }

    logTaskSync("Task toggled", { taskId, isComplete: nextCompleted });
  };

  const toggleWeeklyTask = (catIndex: number, taskId: string) => {
    const targetTask = weeklyCategories[catIndex]?.tasks.find((t) => t.id === taskId);
    if (!targetTask) return;
    const nextCompleted = !targetTask.completed;

    setWeeklyCategories((prev) =>
      prev.map((cat, i) =>
        i === catIndex
          ? {
              ...cat,
              tasks: cat.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: nextCompleted } : t
              ),
            }
          : cat
      )
    );

    const nowIso = new Date().toISOString();
    const cat = weeklyCategories[catIndex];
    if (cat?.id) {
      putLocalTask({
        id: taskId,
        userId: userId ?? null,
        categoryId: cat.id,
        title: targetTask.text,
        taskType: "WEEKLY",
        isComplete: nextCompleted,
        createdAt: nowIso,
        updatedAt: nowIso,
        completedAt: nextCompleted ? nowIso : null,
        syncState: "pending",
      }).catch(() => {});
    }

    if (isLoggedIn && userId) {
      enqueueMutation({
        id: crypto.randomUUID(),
        entityType: "TASK",
        action: "TOGGLE",
        payload: { taskId, isComplete: nextCompleted },
        createdAt: Date.now(),
        retryCount: 0,
      })
        .then(() => {
          scheduleSync(userId);
        })
        .catch(() => {});

      trackLogRocketEvent("TaskToggled", {
        taskId,
        taskType: "weekly",
        isComplete: nextCompleted,
      });
    }

    logTaskSync("Task toggled", { taskId, isComplete: nextCompleted });
  };

  const handleDeleteTask = (catIndex: number, taskId: string, taskType: "daily" | "weekly") => {
    if (taskType === "daily") {
      setDailyCategories((prev) =>
        prev.map((cat, i) =>
          i === catIndex
            ? {
                ...cat,
                tasks: cat.tasks.filter((t) => t.id !== taskId),
              }
            : cat
        )
      );
    } else {
      setWeeklyCategories((prev) =>
        prev.map((cat, i) =>
          i === catIndex
            ? {
                ...cat,
                tasks: cat.tasks.filter((t) => t.id !== taskId),
              }
            : cat
        )
      );
    }

    deleteLocalTask(taskId).catch(() => {});

    if (isLoggedIn && userId) {
      enqueueMutation({
        id: crypto.randomUUID(),
        entityType: "TASK",
        action: "DELETE",
        payload: { taskId },
        createdAt: Date.now(),
        retryCount: 0,
      })
        .then(() => {
          scheduleSync(userId);
        })
        .catch(() => {});
    }

    logTaskSync("Task deleted", { taskId });
  };

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-context-menu]")) {
        return;
      }
      setContextMenu(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("pointerdown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  const openCategoryMenuFromButton = (
    e: React.MouseEvent,
    cat: CategoryGroup,
    taskType: "daily" | "weekly",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(10, Math.min(rect.left, window.innerWidth - 180));
    const y = Math.max(10, Math.min(rect.bottom + 4, window.innerHeight - 120));
    setContextMenu({
      type: "category",
      x,
      y,
      category: { id: cat.id, name: cat.name, taskType },
    });
  };

  const handleCategoryContextMenu = (
    e: React.MouseEvent,
    cat: CategoryGroup,
    taskType: "daily" | "weekly",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.max(10, Math.min(e.clientX, window.innerWidth - 180));
    const y = Math.max(10, Math.min(e.clientY, window.innerHeight - 120));
    setContextMenu({
      type: "category",
      x,
      y,
      category: { id: cat.id, name: cat.name, taskType },
    });
  };

  const openTaskMenuFromButton = (
    e: React.MouseEvent,
    task: TaskItem,
    catIdx: number,
    taskType: "daily" | "weekly",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(10, Math.min(rect.left, window.innerWidth - 180));
    const y = Math.max(10, Math.min(rect.bottom + 4, window.innerHeight - 120));
    setContextMenu({
      type: "task",
      x,
      y,
      task: { id: task.id, text: task.text, catIdx, taskType },
    });
  };

  const handleTaskContextMenu = (
    e: React.MouseEvent,
    task: TaskItem,
    catIdx: number,
    taskType: "daily" | "weekly",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.max(10, Math.min(e.clientX, window.innerWidth - 180));
    const y = Math.max(10, Math.min(e.clientY, window.innerHeight - 120));
    setContextMenu({
      type: "task",
      x,
      y,
      task: { id: task.id, text: task.text, catIdx, taskType },
    });
  };

  const handleSaveEditTask = (newText: string) => {
    if (!editTaskModal || !newText.trim()) return;
    const { id, catIdx, taskType } = editTaskModal;
    const trimmed = newText.trim();

    if (taskType === "daily") {
      setDailyCategories((prev) =>
        prev.map((cat, i) =>
          i === catIdx
            ? {
                ...cat,
                tasks: cat.tasks.map((t) =>
                  t.id === id ? { ...t, text: trimmed } : t,
                ),
              }
            : cat,
        ),
      );
    } else {
      setWeeklyCategories((prev) =>
        prev.map((cat, i) =>
          i === catIdx
            ? {
                ...cat,
                tasks: cat.tasks.map((t) =>
                  t.id === id ? { ...t, text: trimmed } : t,
                ),
              }
            : cat,
        ),
      );
    }

    const cat = taskType === "daily" ? dailyCategories[catIdx] : weeklyCategories[catIdx];
    if (cat?.id) {
      putLocalTask({
        id,
        userId: userId ?? null,
        categoryId: cat.id,
        title: trimmed,
        taskType: taskType === "daily" ? "DAILY" : "WEEKLY",
        isComplete: cat.tasks.find((t) => t.id === id)?.completed ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        syncState: "pending",
      }).catch(() => {});
    }

    if (isLoggedIn && userId) {
      enqueueMutation({
        id: crypto.randomUUID(),
        entityType: "TASK",
        action: "UPDATE",
        payload: { taskId: id, title: trimmed },
        createdAt: Date.now(),
        retryCount: 0,
      })
        .then(() => {
          scheduleSync(userId);
        })
        .catch(() => {});
    }

    logTaskSync("Task updated", { taskId: id, title: trimmed });
    setEditTaskModal(null);
  };

  const handleSaveEditCategory = (newName: string) => {
    if (!editCategoryModal || !newName.trim()) return;
    const oldName = editCategoryModal.name;
    const trimmed = newName.trim();
    const catType = editCategoryModal.taskType;
    const catId =
      editCategoryModal.id ||
      (catType === "daily"
        ? dailyCategoryNameToId.get(oldName) || dailyCategories.find((c) => c.name === oldName)?.id
        : weeklyCategoryNameToId.get(oldName) || weeklyCategories.find((c) => c.name === oldName)?.id);

    if (oldName === trimmed) {
      setEditCategoryModal(null);
      return;
    }

    if (catType === "daily") {
      setDailyCategories((prev) =>
        prev.map((cat) =>
          cat.name === oldName ? { ...cat, name: trimmed } : cat,
        ),
      );
    } else {
      setWeeklyCategories((prev) =>
        prev.map((cat) =>
          cat.name === oldName ? { ...cat, name: trimmed } : cat,
        ),
      );
    }

    if (catId) {
      putLocalCategory({
        id: catId,
        userId: userId ?? null,
        name: trimmed,
        taskType: catType === "daily" ? "DAILY" : "WEEKLY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncState: "pending",
      }).catch(() => {});
    }

    if (isLoggedIn && userId && catId) {
      enqueueMutation({
        id: crypto.randomUUID(),
        entityType: "CATEGORY",
        action: "UPDATE",
        payload: { categoryId: catId, name: trimmed },
        createdAt: Date.now(),
        retryCount: 0,
      })
        .then(() => {
          scheduleSync(userId);
        })
        .catch(() => {});
    }

    logTaskSync("Category updated", { categoryId: catId, name: trimmed });
    setEditCategoryModal(null);
  };

  const handleConfirmDeleteCategory = () => {
    if (!deleteCategoryModal) return;
    const targetName = deleteCategoryModal.name;
    const catType = deleteCategoryModal.taskType;
    const catId =
      deleteCategoryModal.id ||
      (catType === "daily"
        ? dailyCategoryNameToId.get(targetName) || dailyCategories.find((c) => c.name === targetName)?.id
        : weeklyCategoryNameToId.get(targetName) || weeklyCategories.find((c) => c.name === targetName)?.id);

    if (catType === "daily") {
      setDailyCategories((prev) =>
        prev.filter((cat) => cat.name !== targetName),
      );
    } else {
      setWeeklyCategories((prev) =>
        prev.filter((cat) => cat.name !== targetName),
      );
    }

    if (catId) {
      deleteLocalCategory(catId).catch(() => {});
    }

    if (isLoggedIn && userId && catId) {
      enqueueMutation({
        id: crypto.randomUUID(),
        entityType: "CATEGORY",
        action: "DELETE",
        payload: { categoryId: catId },
        createdAt: Date.now(),
        retryCount: 0,
      })
        .then(() => {
          scheduleSync(userId);
        })
        .catch(() => {});
    }

    logTaskSync("Category deleted", { categoryId: catId, name: targetName });
    setDeleteCategoryModal(null);
  };

  const totalDailyTasks = dailyCategories.reduce(
    (acc, cat) => acc + cat.tasks.length,
    0
  );
  const completedDailyTasks = dailyCategories.reduce(
    (acc, cat) => acc + cat.tasks.filter((t) => t.completed).length,
    0
  );

  const totalWeeklyTasks = weeklyCategories.reduce(
    (acc, cat) => acc + cat.tasks.length,
    0
  );
  const completedWeeklyTasks = weeklyCategories.reduce(
    (acc, cat) => acc + cat.tasks.filter((t) => t.completed).length,
    0
  );

  const handleAddTodoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const isNew = isCreatingCategory && customCategory.trim();
    const targetCategoryName =
      (isNew ? customCategory.trim() : selectedCategory) || "General";
    const taskType = addModalType === "daily" ? "DAILY" : "WEEKLY";

    const newTaskId = crypto.randomUUID();
    const newTask: TaskItem = {
      id: newTaskId,
      text: newTodoText.trim(),
      completed: false,
    };

    let targetCatId: string | undefined = undefined;

    if (addModalType === "daily") {
      const existing = dailyCategories.find((c) => c.name === targetCategoryName);
      targetCatId = existing?.id || (isNew ? crypto.randomUUID() : dailyCategoryNameToId.get(targetCategoryName) || crypto.randomUUID());

      setDailyCategories((prev) => {
        const existingIndex = prev.findIndex((c) => c.name === targetCategoryName);
        if (existingIndex >= 0) {
          return prev.map((cat, i) =>
            i === existingIndex
              ? { ...cat, id: cat.id || targetCatId, isCollapsed: false, tasks: [...cat.tasks, newTask] }
              : cat
          );
        } else {
          return [
            ...prev,
            { id: targetCatId, name: targetCategoryName, isCollapsed: false, tasks: [newTask] },
          ];
        }
      });
    } else {
      const existing = weeklyCategories.find((c) => c.name === targetCategoryName);
      targetCatId = existing?.id || (isNew ? crypto.randomUUID() : weeklyCategoryNameToId.get(targetCategoryName) || crypto.randomUUID());

      setWeeklyCategories((prev) => {
        const existingIndex = prev.findIndex((c) => c.name === targetCategoryName);
        if (existingIndex >= 0) {
          return prev.map((cat, i) =>
            i === existingIndex
              ? { ...cat, id: cat.id || targetCatId, isCollapsed: false, tasks: [...cat.tasks, newTask] }
              : cat
          );
        } else {
          return [
            ...prev,
            { id: targetCatId, name: targetCategoryName, isCollapsed: false, tasks: [newTask] },
          ];
        }
      });
    }

    const nowIso = new Date().toISOString();

    if (isNew && targetCatId) {
      putLocalCategory({
        id: targetCatId,
        userId: userId ?? null,
        name: targetCategoryName,
        taskType,
        createdAt: nowIso,
        updatedAt: nowIso,
        syncState: "pending",
      }).catch(() => {});
    }

    if (targetCatId) {
      putLocalTask({
        id: newTaskId,
        userId: userId ?? null,
        categoryId: targetCatId,
        title: newTodoText.trim(),
        taskType,
        isComplete: false,
        createdAt: nowIso,
        updatedAt: nowIso,
        completedAt: null,
        syncState: "pending",
      }).catch(() => {});
    }

    if (isLoggedIn && userId) {
      if (isNew && targetCatId) {
        enqueueMutation({
          id: crypto.randomUUID(),
          entityType: "CATEGORY",
          action: "CREATE",
          payload: {
            id: targetCatId,
            name: targetCategoryName,
            taskType,
          },
          createdAt: Date.now(),
          retryCount: 0,
        }).catch(() => {});
      }

      enqueueMutation({
        id: crypto.randomUUID(),
        entityType: "TASK",
        action: "CREATE",
        payload: {
          id: newTaskId,
          categoryId: targetCatId,
          title: newTodoText.trim(),
          taskType,
          isComplete: false,
        },
        createdAt: Date.now() + 1,
        retryCount: 0,
      })
        .then(() => {
          scheduleSync(userId);
        })
        .catch(() => {});

      trackLogRocketEvent("TaskCreated", {
        taskType,
        isNewCategory: isNew,
      });
    }

    logTaskSync("Task created", { id: newTaskId, title: newTodoText.trim() });

    setNewTodoText("");
    setCustomCategory("");
    setIsCreatingCategory(false);
    setAddModalType(null);
  };

  // ---------------------------------------------------------------------------
  // Drag and Drop Event Handlers
  // ---------------------------------------------------------------------------

  const handleTaskDragStart = (
    e: React.DragEvent,
    taskId: string,
    catIdx: number,
    column: "daily" | "weekly",
  ) => {
    e.stopPropagation();
    setDraggedItem({
      type: "task",
      id: taskId,
      sourceCatIdx: catIdx,
      sourceColumn: column,
    });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "task", taskId, catIdx, column }),
    );

    const targetEl = e.currentTarget as HTMLElement;
    const cardEl = targetEl.closest<HTMLElement>('[data-drag-card="task"]');
    if (cardEl && e.dataTransfer && e.dataTransfer.setDragImage) {
      const rect = cardEl.getBoundingClientRect();
      const offsetX = Math.max(16, Math.min(e.clientX - rect.left, rect.width - 16));
      const offsetY = Math.max(12, Math.min(e.clientY - rect.top, rect.height - 12));
      e.dataTransfer.setDragImage(cardEl, offsetX, offsetY);
    }
  };

  const handleCategoryDragStart = (
    e: React.DragEvent,
    catIdx: number,
    column: "daily" | "weekly",
  ) => {
    e.stopPropagation();
    setDraggedItem({
      type: "category",
      sourceCatIdx: catIdx,
      sourceColumn: column,
    });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "category", catIdx, column }),
    );

    const targetEl = e.currentTarget as HTMLElement;
    const cardEl = targetEl.closest<HTMLElement>('[data-drag-card="category"]');
    if (cardEl && e.dataTransfer && e.dataTransfer.setDragImage) {
      const rect = cardEl.getBoundingClientRect();
      const offsetX = Math.max(20, Math.min(e.clientX - rect.left, rect.width - 20));
      const offsetY = 20;
      e.dataTransfer.setDragImage(cardEl, offsetX, offsetY);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverInfo(null);
  };

  const handleTaskDragOver = (
    e: React.DragEvent,
    targetTaskId: string,
    targetCatIdx: number,
    targetColumn: "daily" | "weekly",
  ) => {
    if (!draggedItem || draggedItem.type !== "task") return;
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? "above" : "below";

    setDragOverInfo({
      type: "task",
      targetId: targetTaskId,
      targetCatIdx,
      targetColumn,
      position,
    });
  };

  const handleCategoryDragOver = (
    e: React.DragEvent,
    targetCatIdx: number,
    targetColumn: "daily" | "weekly",
  ) => {
    if (!draggedItem) return;
    e.preventDefault();
    e.stopPropagation();

    if (draggedItem.type === "category") {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? "above" : "below";
      setDragOverInfo({
        type: "category",
        targetCatIdx,
        targetColumn,
        position,
      });
    } else if (draggedItem.type === "task") {
      setDragOverInfo({
        type: "category",
        targetCatIdx,
        targetColumn,
      });
    }
  };

  const handleColumnDragOver = (
    e: React.DragEvent,
    targetColumn: "daily" | "weekly",
  ) => {
    if (!draggedItem) return;
    e.preventDefault();
    if (!dragOverInfo || dragOverInfo.targetColumn !== targetColumn) {
      setDragOverInfo({
        type: "column",
        targetColumn,
      });
    }
  };

  const handleTaskDrop = (
    e: React.DragEvent,
    targetTaskId: string,
    targetCatIdx: number,
    targetColumn: "daily" | "weekly",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem || draggedItem.type !== "task" || !draggedItem.id) {
      handleDragEnd();
      return;
    }

    const targetCategories =
      targetColumn === "daily" ? dailyCategories : weeklyCategories;
    const targetCat = targetCategories[targetCatIdx];
    if (!targetCat) {
      handleDragEnd();
      return;
    }

    const targetIndexInCat = targetCat.tasks.findIndex((t) => t.id === targetTaskId);
    const destIdx =
      dragOverInfo?.position === "below" ? targetIndexInCat + 1 : targetIndexInCat;

    const res = moveTaskBetweenCategories({
      taskId: draggedItem.id,
      sourceCategoryIndex: draggedItem.sourceCatIdx,
      sourceColumn: draggedItem.sourceColumn,
      targetCategoryIndex: targetCatIdx,
      targetColumn,
      targetTaskIndex: Math.max(0, destIdx),
      dailyCategories,
      weeklyCategories,
    });

    setDailyCategories(res.dailyCategories);
    setWeeklyCategories(res.weeklyCategories);

    if (res.movedTask && res.targetCategoryId) {
      const nowIso = new Date().toISOString();
      const targetCats =
        res.targetTaskType === "DAILY" ? res.dailyCategories : res.weeklyCategories;
      const targetCatGroup = targetCats[targetCatIdx];

      if (targetCatGroup && targetCatGroup.tasks.length > 0) {
        const tasksToUpdate: LocalTaskRecord[] = targetCatGroup.tasks.map((t, idx) => ({
          id: t.id,
          userId: userId ?? null,
          categoryId: res.targetCategoryId!,
          title: t.text,
          taskType: res.targetTaskType,
          sortOrder: idx,
          isComplete: t.completed,
          createdAt: nowIso,
          updatedAt: nowIso,
          completedAt: t.completed ? nowIso : null,
          syncState: "pending",
        }));
        putLocalTasks(tasksToUpdate).catch(() => {});
      } else {
        putLocalTask({
          id: res.movedTask.id,
          userId: userId ?? null,
          categoryId: res.targetCategoryId,
          title: res.movedTask.text ?? res.movedTask.title ?? "",
          taskType: res.targetTaskType,
          sortOrder: destIdx,
          isComplete: Boolean(res.movedTask.completed ?? res.movedTask.isComplete),
          createdAt: nowIso,
          updatedAt: nowIso,
          completedAt: (res.movedTask.completed ?? res.movedTask.isComplete) ? nowIso : null,
          syncState: "pending",
        }).catch(() => {});
      }

      if (isLoggedIn && userId) {
        enqueueMutation({
          id: crypto.randomUUID(),
          entityType: "TASK",
          action: "MOVE",
          payload: {
            taskId: res.movedTask.id,
            categoryId: res.targetCategoryId,
            taskType: res.targetTaskType,
            sortOrder: destIdx,
          },
          createdAt: Date.now(),
          retryCount: 0,
        })
          .then(() => {
            scheduleSync(userId);
          })
          .catch(() => {});

        trackLogRocketEvent("TaskMoved", {
          taskId: res.movedTask.id,
          targetTaskType: res.targetTaskType,
        });
      }

      logTaskSync("Task moved via drag and drop", {
        taskId: res.movedTask.id,
        targetCatIdx,
        targetColumn,
      });
    }

    handleDragEnd();
  };

  const handleCategoryDrop = (
    e: React.DragEvent,
    targetCatIdx: number,
    targetColumn: "daily" | "weekly",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem) {
      handleDragEnd();
      return;
    }

    if (draggedItem.type === "category") {
      const destIndex =
        dragOverInfo?.position === "below" ? targetCatIdx + 1 : targetCatIdx;

      const res = moveCategoryBetweenColumns({
        categoryIndex: draggedItem.sourceCatIdx,
        sourceColumn: draggedItem.sourceColumn,
        targetColumn,
        targetIndex: destIndex,
        dailyCategories,
        weeklyCategories,
      });

      setDailyCategories(res.dailyCategories);
      setWeeklyCategories(res.weeklyCategories);

      if (res.movedCategory?.id) {
        const nowIso = new Date().toISOString();
        const catId = res.movedCategory.id;
        const targetType = res.targetTaskType;

        putLocalCategory({
          id: catId,
          userId: userId ?? null,
          name: res.movedCategory.name,
          taskType: targetType,
          sortOrder: destIndex,
          createdAt: nowIso,
          updatedAt: nowIso,
          syncState: "pending",
        }).catch(() => {});

        // Cascade taskType to all tasks inside this category in IndexedDB
        if (res.movedCategory.tasks && res.movedCategory.tasks.length > 0) {
          const tasksToUpdate: LocalTaskRecord[] = res.movedCategory.tasks.map((t, idx) => ({
            id: t.id,
            userId: userId ?? null,
            categoryId: catId,
            title: t.text,
            taskType: targetType,
            sortOrder: idx,
            isComplete: t.completed,
            createdAt: nowIso,
            updatedAt: nowIso,
            completedAt: t.completed ? nowIso : null,
            syncState: "pending",
          }));
          putLocalTasks(tasksToUpdate).catch(() => {});
        }

        // Persist updated sortOrder for all categories in both columns
        const allCatsToUpdate: LocalCategoryRecord[] = [
          ...res.dailyCategories
            .filter((c): c is typeof c & { id: string } => Boolean(c.id))
            .map((c, idx) => ({
              id: c.id,
              userId: userId ?? null,
              name: c.name,
              taskType: "DAILY" as const,
              sortOrder: idx,
              createdAt: nowIso,
              updatedAt: nowIso,
              syncState: "pending" as const,
            })),
          ...res.weeklyCategories
            .filter((c): c is typeof c & { id: string } => Boolean(c.id))
            .map((c, idx) => ({
              id: c.id,
              userId: userId ?? null,
              name: c.name,
              taskType: "WEEKLY" as const,
              sortOrder: idx,
              createdAt: nowIso,
              updatedAt: nowIso,
              syncState: "pending" as const,
            })),
        ];

        putLocalCategories(allCatsToUpdate).catch(() => {});

        if (isLoggedIn && userId) {
          enqueueMutation({
            id: crypto.randomUUID(),
            entityType: "CATEGORY",
            action: "MOVE",
            payload: {
              categoryId: res.movedCategory.id,
              taskType: res.targetTaskType,
              sortOrder: destIndex,
            },
            createdAt: Date.now(),
            retryCount: 0,
          })
            .then(() => {
              scheduleSync(userId);
            })
            .catch(() => {});

          trackLogRocketEvent("CategoryMoved", {
            categoryId: res.movedCategory.id,
            targetTaskType: res.targetTaskType,
          });
        }

        logTaskSync("Category moved via drag and drop", {
          categoryId: res.movedCategory.id,
          targetColumn,
        });
      }
    } else if (draggedItem.type === "task" && draggedItem.id) {
      // Dropping a task into a category header
      const res = moveTaskBetweenCategories({
        taskId: draggedItem.id,
        sourceCategoryIndex: draggedItem.sourceCatIdx,
        sourceColumn: draggedItem.sourceColumn,
        targetCategoryIndex: targetCatIdx,
        targetColumn,
        targetTaskIndex: 0,
        dailyCategories,
        weeklyCategories,
      });

      setDailyCategories(res.dailyCategories);
      setWeeklyCategories(res.weeklyCategories);

      if (res.movedTask && res.targetCategoryId) {
        const nowIso = new Date().toISOString();
        putLocalTask({
          id: res.movedTask.id,
          userId: userId ?? null,
          categoryId: res.targetCategoryId,
          title: res.movedTask.text ?? res.movedTask.title ?? "",
          taskType: res.targetTaskType,
          isComplete: Boolean(res.movedTask.completed ?? res.movedTask.isComplete),
          createdAt: nowIso,
          updatedAt: nowIso,
          completedAt: (res.movedTask.completed ?? res.movedTask.isComplete) ? nowIso : null,
          syncState: "pending",
        }).catch(() => {});

        if (isLoggedIn && userId) {
          enqueueMutation({
            id: crypto.randomUUID(),
            entityType: "TASK",
            action: "MOVE",
            payload: {
              taskId: res.movedTask.id,
              categoryId: res.targetCategoryId,
              taskType: res.targetTaskType,
              sortOrder: 0,
            },
            createdAt: Date.now(),
            retryCount: 0,
          })
            .then(() => {
              scheduleSync(userId);
            })
            .catch(() => {});
        }
      }
    }

    handleDragEnd();
  };

  const handleColumnDrop = (
    e: React.DragEvent,
    targetColumn: "daily" | "weekly",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem) {
      handleDragEnd();
      return;
    }

    const targetCategories =
      targetColumn === "daily" ? dailyCategories : weeklyCategories;

    if (draggedItem.type === "category") {
      const destIndex = targetCategories.length;
      const res = moveCategoryBetweenColumns({
        categoryIndex: draggedItem.sourceCatIdx,
        sourceColumn: draggedItem.sourceColumn,
        targetColumn,
        targetIndex: destIndex,
        dailyCategories,
        weeklyCategories,
      });

      setDailyCategories(res.dailyCategories);
      setWeeklyCategories(res.weeklyCategories);

      if (res.movedCategory?.id) {
        const nowIso = new Date().toISOString();
        const catId = res.movedCategory.id;
        const targetType = res.targetTaskType;

        putLocalCategory({
          id: catId,
          userId: userId ?? null,
          name: res.movedCategory.name,
          taskType: targetType,
          sortOrder: destIndex,
          createdAt: nowIso,
          updatedAt: nowIso,
          syncState: "pending",
        }).catch(() => {});

        if (res.movedCategory.tasks && res.movedCategory.tasks.length > 0) {
          const tasksToUpdate: LocalTaskRecord[] = res.movedCategory.tasks.map((t, idx) => ({
            id: t.id,
            userId: userId ?? null,
            categoryId: catId,
            title: t.text,
            taskType: targetType,
            sortOrder: idx,
            isComplete: t.completed,
            createdAt: nowIso,
            updatedAt: nowIso,
            completedAt: t.completed ? nowIso : null,
            syncState: "pending",
          }));
          putLocalTasks(tasksToUpdate).catch(() => {});
        }

        const allCatsToUpdate: LocalCategoryRecord[] = [
          ...res.dailyCategories
            .filter((c): c is typeof c & { id: string } => Boolean(c.id))
            .map((c, idx) => ({
              id: c.id,
              userId: userId ?? null,
              name: c.name,
              taskType: "DAILY" as const,
              sortOrder: idx,
              createdAt: nowIso,
              updatedAt: nowIso,
              syncState: "pending" as const,
            })),
          ...res.weeklyCategories
            .filter((c): c is typeof c & { id: string } => Boolean(c.id))
            .map((c, idx) => ({
              id: c.id,
              userId: userId ?? null,
              name: c.name,
              taskType: "WEEKLY" as const,
              sortOrder: idx,
              createdAt: nowIso,
              updatedAt: nowIso,
              syncState: "pending" as const,
            })),
        ];

        putLocalCategories(allCatsToUpdate).catch(() => {});

        if (isLoggedIn && userId) {
          enqueueMutation({
            id: crypto.randomUUID(),
            entityType: "CATEGORY",
            action: "MOVE",
            payload: {
              categoryId: res.movedCategory.id,
              taskType: res.targetTaskType,
              sortOrder: destIndex,
            },
            createdAt: Date.now(),
            retryCount: 0,
          })
            .then(() => {
              scheduleSync(userId);
            })
            .catch(() => {});
        }
      }
    } else if (draggedItem.type === "task" && draggedItem.id) {
      // Drop task into the last category of the target column
      if (targetCategories.length > 0) {
        const lastCatIdx = targetCategories.length - 1;
        const res = moveTaskBetweenCategories({
          taskId: draggedItem.id,
          sourceCategoryIndex: draggedItem.sourceCatIdx,
          sourceColumn: draggedItem.sourceColumn,
          targetCategoryIndex: lastCatIdx,
          targetColumn,
          targetTaskIndex: targetCategories[lastCatIdx].tasks.length,
          dailyCategories,
          weeklyCategories,
        });

        setDailyCategories(res.dailyCategories);
        setWeeklyCategories(res.weeklyCategories);

        if (res.movedTask && res.targetCategoryId) {
          const nowIso = new Date().toISOString();
          putLocalTask({
            id: res.movedTask.id,
            userId: userId ?? null,
            categoryId: res.targetCategoryId,
            title: res.movedTask.text ?? res.movedTask.title ?? "",
            taskType: res.targetTaskType,
            isComplete: Boolean(res.movedTask.completed ?? res.movedTask.isComplete),
            createdAt: nowIso,
            updatedAt: nowIso,
            completedAt: (res.movedTask.completed ?? res.movedTask.isComplete) ? nowIso : null,
            syncState: "pending",
          }).catch(() => {});

          if (isLoggedIn && userId) {
            enqueueMutation({
              id: crypto.randomUUID(),
              entityType: "TASK",
              action: "MOVE",
              payload: {
                taskId: res.movedTask.id,
                categoryId: res.targetCategoryId,
                taskType: res.targetTaskType,
                sortOrder: targetCategories[lastCatIdx].tasks.length,
              },
              createdAt: Date.now(),
              retryCount: 0,
            })
              .then(() => {
                scheduleSync(userId);
              })
              .catch(() => {});
          }
        }
      }
    }

    handleDragEnd();
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Daily Todos */}
        <div
          onDragOver={(e) => handleColumnDragOver(e, "daily")}
          onDrop={(e) => handleColumnDrop(e, "daily")}
          className={`rounded-2xl border bg-[#141414] p-6 shadow-md flex flex-col justify-between space-y-5 transition-all ${
            dragOverInfo?.type === "column" && dragOverInfo.targetColumn === "daily"
              ? "border-[#e08a32] ring-1 ring-[#e08a32]/50 bg-[#1a1816]"
              : "border-[#262626]"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#ffffff]">Daily Todos</h3>
              <span className="text-xs font-semibold text-[#d2d2d2]">
                {completedDailyTasks}/{totalDailyTasks} Completed
              </span>
            </div>

            <div className="space-y-3">
              {dailyCategories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#333333] bg-[#1a1a1a]/50 p-6 text-center">
                  <p className="text-sm font-medium text-[#d1d1d1]">No daily todos yet</p>
                  <p className="text-xs text-[#868686] mt-1">Organize your daily study commitments by adding your first task.</p>
                </div>
              ) : (
                dailyCategories.map((cat, catIdx) => {
                const isCatDragging =
                  draggedItem?.type === "category" &&
                  draggedItem.sourceColumn === "daily" &&
                  draggedItem.sourceCatIdx === catIdx;
                const isCatOver =
                  dragOverInfo?.type === "category" &&
                  dragOverInfo.targetColumn === "daily" &&
                  dragOverInfo.targetCatIdx === catIdx;

                return (
                  <div
                    key={cat.id || cat.name}
                    data-drag-card="category"
                    onDragOver={(e) => handleCategoryDragOver(e, catIdx, "daily")}
                    onDrop={(e) => handleCategoryDrop(e, catIdx, "daily")}
                    className={`rounded-xl bg-[#292929] overflow-hidden border transition-all ${
                      isCatDragging ? "opacity-30 border-dashed border-[#e08a32] bg-[#1e1e1e] scale-[0.99]" : ""
                    } ${
                      isCatOver && dragOverInfo?.position === "above"
                        ? "border-t-2 border-t-[#e08a32] border-[#333333]"
                        : isCatOver && dragOverInfo?.position === "below"
                        ? "border-b-2 border-b-[#e08a32] border-[#333333]"
                        : isCatOver
                        ? "border-[#e08a32]"
                        : "border-[#333333]"
                    }`}
                  >
                    <div
                      onContextMenu={(e) => handleCategoryContextMenu(e, cat, "daily")}
                      onClick={() => toggleDailyCollapse(catIdx)}
                      className="w-full flex items-center justify-between px-3 py-3 text-left font-medium text-sm text-[#ffffff] hover:bg-[#333333] transition-colors cursor-pointer select-none"
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleCategoryDragStart(e, catIdx, "daily")}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 -ml-1 mr-1 text-[#666] hover:text-[#e08a32] cursor-grab active:cursor-grabbing rounded transition-colors shrink-0"
                        title="Drag category to reorder or move across boards"
                        aria-label={`Drag category ${cat.name}`}
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="truncate flex-1 pr-2">{cat.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLoggedIn && (
                          <button
                            type="button"
                            onClick={(e) => openCategoryMenuFromButton(e, cat, "daily")}
                            className="p-1 rounded-md text-[#868686] hover:text-[#ffffff] hover:bg-[#3d3d3d] transition-colors"
                            title="Category options"
                            aria-label={`Options for category ${cat.name}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                        {cat.isCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-[#868686]" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-[#868686]" />
                        )}
                      </div>
                    </div>

                    {!cat.isCollapsed && (
                      <div className="px-4 pb-3 pt-1 space-y-2.5 border-t border-[#383838]">
                        {cat.tasks.length === 0 ? (
                          <p className="text-xs text-[#868686] py-1">No daily tasks in this category.</p>
                        ) : (
                          cat.tasks.map((task) => {
                            const isTaskDragging =
                              draggedItem?.type === "task" && draggedItem.id === task.id;
                            const isTaskOver =
                              dragOverInfo?.type === "task" && dragOverInfo.targetId === task.id;

                            return (
                              <div
                                key={task.id}
                                data-drag-card="task"
                                onDragOver={(e) =>
                                  handleTaskDragOver(e, task.id, catIdx, "daily")
                                }
                                onDrop={(e) =>
                                  handleTaskDrop(e, task.id, catIdx, "daily")
                                }
                                onContextMenu={(e) =>
                                  handleTaskContextMenu(e, task, catIdx, "daily")
                                }
                                className={`flex items-start justify-between gap-2 p-1.5 rounded-lg hover:bg-[#383838] transition-all group ${
                                  isTaskDragging
                                    ? "opacity-30 border border-dashed border-[#e08a32] bg-[#1e1e1e]"
                                    : ""
                                } ${
                                  isTaskOver && dragOverInfo?.position === "above"
                                    ? "border-t-2 border-t-[#e08a32]"
                                    : isTaskOver && dragOverInfo?.position === "below"
                                    ? "border-b-2 border-b-[#e08a32]"
                                    : ""
                                }`}
                              >
                                <div
                                  draggable
                                  onDragStart={(e) =>
                                    handleTaskDragStart(e, task.id, catIdx, "daily")
                                  }
                                  onDragEnd={handleDragEnd}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 -ml-1 text-[#666] hover:text-[#e08a32] cursor-grab active:cursor-grabbing rounded transition-colors shrink-0 mt-0.5"
                                  title="Drag task to reorder or move across categories"
                                  aria-label={`Drag task ${task.text}`}
                                >
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                                <div
                                  onClick={() => toggleDailyTask(catIdx, task.id)}
                                  className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                                >
                                  <div
                                    className={`h-5 w-5 rounded flex items-center justify-center border transition-all shrink-0 mt-0.5 ${
                                      task.completed
                                        ? "bg-[#ffffff] border-[#ffffff] text-[#0d0d0d]"
                                        : "border-[#ffffff] bg-transparent group-hover:border-gray-300"
                                    }`}
                                  >
                                    {task.completed && (
                                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-sm line-clamp-2 break-words leading-snug ${
                                      task.completed
                                        ? "text-[#868686] line-through"
                                        : "text-[#ffffff]"
                                    }`}
                                  >
                                    {task.text}
                                  </span>
                                </div>
                                {isLoggedIn && (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      openTaskMenuFromButton(
                                        e,
                                        task,
                                        catIdx,
                                        "daily",
                                      )
                                    }
                                    className="opacity-0 group-hover:opacity-100 sm:opacity-0 max-sm:opacity-100 p-1 text-[#868686] hover:text-[#ffffff] rounded hover:bg-[#444444] transition-opacity shrink-0 mt-0.5"
                                    title="Task options"
                                    aria-label={`Options for task ${task.text}`}
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>

          <div className="pt-2 text-center">
            <Button
              type="button"
              onClick={() => {
                setAddModalType("daily");
                if (dailyCategoryOptions.length > 0) {
                  setSelectedCategory(dailyCategoryOptions[0]);
                  setIsCreatingCategory(false);
                } else {
                  setSelectedCategory("");
                  setIsCreatingCategory(true);
                }
              }}
              className="h-10 px-6 rounded-full bg-[#ffffff] text-[#000000] text-xs font-bold hover:bg-[#e0e0e0] shadow-sm inline-flex items-center gap-1.5"
            >
              {dailyCategories.length === 0 ? "+ Add first todo" : "+ Add more todos"}
            </Button>
          </div>
        </div>

        {/* Weekly Todos */}
        <div
          onDragOver={(e) => handleColumnDragOver(e, "weekly")}
          onDrop={(e) => handleColumnDrop(e, "weekly")}
          className={`rounded-2xl border bg-[#141414] p-6 shadow-md flex flex-col justify-between space-y-5 transition-all ${
            dragOverInfo?.type === "column" && dragOverInfo.targetColumn === "weekly"
              ? "border-[#e08a32] ring-1 ring-[#e08a32]/50 bg-[#1a1816]"
              : "border-[#262626]"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#ffffff]">Weekly Todos</h3>
              <span className="text-xs font-semibold text-[#d2d2d2]">
                {completedWeeklyTasks}/{totalWeeklyTasks} Completed
              </span>
            </div>

            <div className="space-y-3">
              {weeklyCategories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#333333] bg-[#1a1a1a]/50 p-6 text-center">
                  <p className="text-sm font-medium text-[#d1d1d1]">No weekly todos yet</p>
                  <p className="text-xs text-[#868686] mt-1">Set your weekly milestones and track them across the challenge.</p>
                </div>
              ) : (
                weeklyCategories.map((cat, catIdx) => {
                const isCatDragging =
                  draggedItem?.type === "category" &&
                  draggedItem.sourceColumn === "weekly" &&
                  draggedItem.sourceCatIdx === catIdx;
                const isCatOver =
                  dragOverInfo?.type === "category" &&
                  dragOverInfo.targetColumn === "weekly" &&
                  dragOverInfo.targetCatIdx === catIdx;

                return (
                  <div
                    key={cat.id || cat.name}
                    data-drag-card="category"
                    onDragOver={(e) => handleCategoryDragOver(e, catIdx, "weekly")}
                    onDrop={(e) => handleCategoryDrop(e, catIdx, "weekly")}
                    className={`rounded-xl bg-[#292929] overflow-hidden border transition-all ${
                      isCatDragging ? "opacity-30 border-dashed border-[#e08a32] bg-[#1e1e1e] scale-[0.99]" : ""
                    } ${
                      isCatOver && dragOverInfo?.position === "above"
                        ? "border-t-2 border-t-[#e08a32] border-[#333333]"
                        : isCatOver && dragOverInfo?.position === "below"
                        ? "border-b-2 border-b-[#e08a32] border-[#333333]"
                        : isCatOver
                        ? "border-[#e08a32]"
                        : "border-[#333333]"
                    }`}
                  >
                    <div
                      onContextMenu={(e) => handleCategoryContextMenu(e, cat, "weekly")}
                      onClick={() => toggleWeeklyCollapse(catIdx)}
                      className="w-full flex items-center justify-between px-3 py-3 text-left font-medium text-sm text-[#ffffff] hover:bg-[#333333] transition-colors cursor-pointer select-none"
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleCategoryDragStart(e, catIdx, "weekly")}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 -ml-1 mr-1 text-[#666] hover:text-[#e08a32] cursor-grab active:cursor-grabbing rounded transition-colors shrink-0"
                        title="Drag category to reorder or move across boards"
                        aria-label={`Drag category ${cat.name}`}
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="truncate flex-1 pr-2">{cat.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLoggedIn && (
                          <button
                            type="button"
                            onClick={(e) => openCategoryMenuFromButton(e, cat, "weekly")}
                            className="p-1 rounded-md text-[#868686] hover:text-[#ffffff] hover:bg-[#3d3d3d] transition-colors"
                            title="Category options"
                            aria-label={`Options for category ${cat.name}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                        {cat.isCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-[#868686]" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-[#868686]" />
                        )}
                      </div>
                    </div>

                    {!cat.isCollapsed && (
                      <div className="px-4 pb-3 pt-1 space-y-2.5 border-t border-[#383838]">
                        {cat.tasks.length === 0 ? (
                          <p className="text-xs text-[#868686] py-1">No weekly tasks in this category.</p>
                        ) : (
                          cat.tasks.map((task) => {
                            const isTaskDragging =
                              draggedItem?.type === "task" && draggedItem.id === task.id;
                            const isTaskOver =
                              dragOverInfo?.type === "task" && dragOverInfo.targetId === task.id;

                            return (
                              <div
                                key={task.id}
                                data-drag-card="task"
                                onDragOver={(e) =>
                                  handleTaskDragOver(e, task.id, catIdx, "weekly")
                                }
                                onDrop={(e) =>
                                  handleTaskDrop(e, task.id, catIdx, "weekly")
                                }
                                onContextMenu={(e) =>
                                  handleTaskContextMenu(e, task, catIdx, "weekly")
                                }
                                className={`flex items-start justify-between gap-2 p-1.5 rounded-lg hover:bg-[#383838] transition-all group ${
                                  isTaskDragging
                                    ? "opacity-30 border border-dashed border-[#e08a32] bg-[#1e1e1e]"
                                    : ""
                                } ${
                                  isTaskOver && dragOverInfo?.position === "above"
                                    ? "border-t-2 border-t-[#e08a32]"
                                    : isTaskOver && dragOverInfo?.position === "below"
                                    ? "border-b-2 border-b-[#e08a32]"
                                    : ""
                                }`}
                              >
                                <div
                                  draggable
                                  onDragStart={(e) =>
                                    handleTaskDragStart(e, task.id, catIdx, "weekly")
                                  }
                                  onDragEnd={handleDragEnd}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 -ml-1 text-[#666] hover:text-[#e08a32] cursor-grab active:cursor-grabbing rounded transition-colors shrink-0 mt-0.5"
                                  title="Drag task to reorder or move across categories"
                                  aria-label={`Drag task ${task.text}`}
                                >
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                                <div
                                  onClick={() => toggleWeeklyTask(catIdx, task.id)}
                                  className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                                >
                                  <div
                                    className={`h-5 w-5 rounded flex items-center justify-center border transition-all shrink-0 mt-0.5 ${
                                      task.completed
                                        ? "bg-[#ffffff] border-[#ffffff] text-[#0d0d0d]"
                                        : "border-[#ffffff] bg-transparent group-hover:border-gray-300"
                                    }`}
                                  >
                                    {task.completed && (
                                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-sm line-clamp-2 break-words leading-snug ${
                                      task.completed
                                        ? "text-[#868686] line-through"
                                        : "text-[#ffffff]"
                                    }`}
                                  >
                                    {task.text}
                                  </span>
                                </div>
                                {isLoggedIn && (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      openTaskMenuFromButton(
                                        e,
                                        task,
                                        catIdx,
                                        "weekly",
                                      )
                                    }
                                    className="opacity-0 group-hover:opacity-100 sm:opacity-0 max-sm:opacity-100 p-1 text-[#868686] hover:text-[#ffffff] rounded hover:bg-[#444444] transition-opacity shrink-0 mt-0.5"
                                    title="Task options"
                                    aria-label={`Options for task ${task.text}`}
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>

          <div className="pt-2 text-center">
            <Button
              type="button"
              onClick={() => {
                setAddModalType("weekly");
                if (weeklyCategoryOptions.length > 0) {
                  setSelectedCategory(weeklyCategoryOptions[0]);
                  setIsCreatingCategory(false);
                } else {
                  setSelectedCategory("");
                  setIsCreatingCategory(true);
                }
              }}
              className="h-10 px-6 rounded-full bg-[#ffffff] text-[#000000] text-xs font-bold hover:bg-[#e0e0e0] shadow-sm inline-flex items-center gap-1.5"
            >
              {weeklyCategories.length === 0 ? "+ Add first todo" : "+ Add more todos"}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Todo Modal */}
      {addModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#434343] bg-[#292929] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-[#ffffff]">
                Add {addModalType === "daily" ? "Daily" : "Weekly"} Todo
              </h4>
              <button
                type="button"
                onClick={() => setAddModalType(null)}
                className="text-[#868686] hover:text-[#ffffff] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTodoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#d1d1d1] mb-1.5">
                  Todo Content
                </label>
                <Input
                  type="text"
                  placeholder="What needs to get done?"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  autoFocus
                  required
                  className="h-11 bg-[#545454] border-[#484848] text-[#f4f3f6] placeholder-[#d2d2d2] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#d1d1d1] mb-1.5">
                  Todo Category
                </label>
                {!isCreatingCategory ? (
                  <div className="flex gap-2">
                    <select
                      ref={categorySelectRef}
                      value={selectedCategory}
                      onChange={(e) => {
                        if (e.target.value === "__NEW__") {
                          setIsCreatingCategory(true);
                          setTimeout(() => {
                            categoryInputRef.current?.focus();
                            categoryInputRef.current?.select();
                          }, 50);
                        } else {
                          setSelectedCategory(e.target.value);
                        }
                      }}
                      className="w-full h-11 bg-[#545454] border border-[#484848] text-[#f4f3f6] rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-white"
                    >
                      {(addModalType === "daily" ? dailyCategoryOptions : weeklyCategoryOptions).map((catName) => (
                        <option key={catName} value={catName} className="bg-[#292929] text-white">
                          {catName}
                        </option>
                      ))}
                      <option value="__NEW__" className="bg-[#292929] text-white">
                        + Create New Category...
                      </option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      ref={categoryInputRef}
                      type="text"
                      placeholder="Category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      autoFocus
                      className="h-11 bg-[#545454] border-[#484848] text-[#f4f3f6] rounded-xl"
                    />
                    {(addModalType === "daily" ? dailyCategoryOptions : weeklyCategoryOptions).length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreatingCategory(false);
                          setTimeout(() => {
                            categorySelectRef.current?.focus();
                          }, 50);
                        }}
                        className="h-11 border-[#484848] text-xs text-[#ffffff]"
                      >
                        Back
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddModalType(null)}
                  className="h-11 px-5 rounded-xl bg-[#4a4a4a] text-[#ffffff] hover:bg-[#5a5a5a] text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-[#ffffff] text-[#0d0d0d] hover:bg-[#e0e0e0] text-xs font-semibold"
                >
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          data-context-menu
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[170px] rounded-xl border border-[#383838] bg-[#222222] p-1.5 shadow-2xl animate-in fade-in zoom-in-95"
        >
          {contextMenu.type === "task" && contextMenu.task && (
            <>
              <button
                type="button"
                onClick={() => {
                  const t = contextMenu.task!;
                  setContextMenu(null);
                  setEditTaskModal(t);
                  setEditTaskInputText(t.text);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#f4f3f6] rounded-lg hover:bg-[#333333] transition-colors text-left"
              >
                <Pencil className="h-3.5 w-3.5 text-[#868686]" />
                <span>Edit Task</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = contextMenu.task!;
                  setContextMenu(null);
                  handleDeleteTask(t.catIdx, t.id, t.taskType);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                <span>Delete Task</span>
              </button>
            </>
          )}

          {contextMenu.type === "category" && contextMenu.category && (
            <>
              <button
                type="button"
                onClick={() => {
                  const c = contextMenu.category!;
                  setContextMenu(null);
                  setEditCategoryModal(c);
                  setEditCategoryInputName(c.name);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#f4f3f6] rounded-lg hover:bg-[#333333] transition-colors text-left"
              >
                <Pencil className="h-3.5 w-3.5 text-[#868686]" />
                <span>Rename Category</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const c = contextMenu.category!;
                  setContextMenu(null);
                  setDeleteCategoryModal(c);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                <span>Delete Category</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit Task Modal */}
      {editTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#434343] bg-[#292929] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-[#ffffff]">Edit Task</h4>
              <button
                type="button"
                onClick={() => setEditTaskModal(null)}
                className="text-[#868686] hover:text-[#ffffff] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEditTask(editTaskInputText);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-[#d1d1d1] mb-1.5">
                  Task Title
                </label>
                <Input
                  type="text"
                  value={editTaskInputText}
                  onChange={(e) => setEditTaskInputText(e.target.value)}
                  autoFocus
                  required
                  className="h-11 bg-[#545454] border-[#484848] text-[#f4f3f6] rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditTaskModal(null)}
                  className="h-11 px-5 rounded-xl bg-[#4a4a4a] text-[#ffffff] hover:bg-[#5a5a5a] text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-[#ffffff] text-[#0d0d0d] hover:bg-[#e0e0e0] text-xs font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Category Modal */}
      {editCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#434343] bg-[#292929] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-[#ffffff]">Rename Category</h4>
              <button
                type="button"
                onClick={() => setEditCategoryModal(null)}
                className="text-[#868686] hover:text-[#ffffff] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEditCategory(editCategoryInputName);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-[#d1d1d1] mb-1.5">
                  Category Name
                </label>
                <Input
                  type="text"
                  value={editCategoryInputName}
                  onChange={(e) => setEditCategoryInputName(e.target.value)}
                  autoFocus
                  required
                  className="h-11 bg-[#545454] border-[#484848] text-[#f4f3f6] rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditCategoryModal(null)}
                  className="h-11 px-5 rounded-xl bg-[#4a4a4a] text-[#ffffff] hover:bg-[#5a5a5a] text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-[#ffffff] text-[#0d0d0d] hover:bg-[#e0e0e0] text-xs font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#434343] bg-[#292929] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-[#ffffff]">Delete Category</h4>
              <button
                type="button"
                onClick={() => setDeleteCategoryModal(null)}
                className="text-[#868686] hover:text-[#ffffff] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[#d1d1d1] leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">&quot;{deleteCategoryModal.name}&quot;</span>? All daily and weekly tasks inside this category will also be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteCategoryModal(null)}
                className="h-11 px-5 rounded-xl bg-[#4a4a4a] text-[#ffffff] hover:bg-[#5a5a5a] text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="h-11 px-6 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
              >
                Delete Category
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
