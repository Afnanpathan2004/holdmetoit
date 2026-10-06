"use client";

import { useState, useEffect, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Trash2,
  MoreVertical,
  Pencil,
} from "lucide-react";
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
  const [selectedCategory, setSelectedCategory] = useState("Category 1");
  const [customCategory, setCustomCategory] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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
    return [
      {
        name: "Category 1",
        isCollapsed: true,
        tasks: [
          { id: "d1_1", text: "Read research paper summary", completed: true },
        ],
      },
      {
        name: "Category 2",
        isCollapsed: false,
        tasks: [
          { id: "d2_1", text: "Task 1", completed: true },
          { id: "d2_2", text: "Task 2", completed: false },
        ],
      },
      {
        name: "Category 3",
        isCollapsed: true,
        tasks: [
          { id: "d3_1", text: "Evening flashcards review", completed: false },
        ],
      },
    ];
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
    return [
      {
        name: "Category 1",
        isCollapsed: true,
        tasks: [
          { id: "w1_1", text: "Finish Mathematics Problem Set 3", completed: true },
        ],
      },
      {
        name: "Category 2",
        isCollapsed: false,
        tasks: [
          { id: "w2_1", text: "Task 1", completed: true },
          { id: "w2_2", text: "Task 2", completed: false },
        ],
      },
      {
        name: "Category 3",
        isCollapsed: true,
        tasks: [
          { id: "w3_1", text: "Write Lab Report Conclusion", completed: false },
        ],
      },
    ];
  });

  const dailyCategoryOptions = Array.from(
    new Set([
      ...(userTasks?.categories?.filter((c) => c.taskType === "DAILY").map((c) => c.name) ?? []),
      ...dailyCategories.map((c) => c.name),
      "Category 1",
    ]),
  );

  const weeklyCategoryOptions = Array.from(
    new Set([
      ...(userTasks?.categories?.filter((c) => c.taskType === "WEEKLY").map((c) => c.name) ?? []),
      ...weeklyCategories.map((c) => c.name),
      "Category 1",
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

          const dailyCats = localCats
            .filter((c) => c.taskType === "DAILY")
            .map((c) => ({
              id: c.id,
              name: c.name,
              isCollapsed: false,
              tasks: localTasks
                .filter((t) => t.categoryId === c.id && t.taskType === "DAILY")
                .map((t) => ({
                  id: t.id,
                  text: t.title,
                  completed: t.isComplete,
                })),
            }));

          const weeklyCats = localCats
            .filter((c) => c.taskType === "WEEKLY")
            .map((c) => ({
              id: c.id,
              name: c.name,
              isCollapsed: false,
              tasks: localTasks
                .filter((t) => t.categoryId === c.id && t.taskType === "WEEKLY")
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
    const targetCategoryName = isNew ? customCategory.trim() : selectedCategory;
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

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Daily Todos */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-md flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#ffffff]">Daily Todos</h3>
              <span className="text-xs font-semibold text-[#d2d2d2]">
                {completedDailyTasks}/{totalDailyTasks} Completed
              </span>
            </div>

            <div className="space-y-3">
              {dailyCategories.map((cat, catIdx) => (
                <div
                  key={cat.name}
                  className="rounded-xl bg-[#292929] overflow-hidden border border-[#333333]"
                >
                  <div
                    onContextMenu={(e) => handleCategoryContextMenu(e, cat, "daily")}
                    onClick={() => toggleDailyCollapse(catIdx)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm text-[#ffffff] hover:bg-[#333333] transition-colors cursor-pointer select-none"
                  >
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
                        cat.tasks.map((task) => (
                          <div
                            key={task.id}
                            onContextMenu={(e) =>
                              handleTaskContextMenu(e, task, catIdx, "daily")
                            }
                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#383838] transition-colors group"
                          >
                            <div
                              onClick={() => toggleDailyTask(catIdx, task.id)}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                            >
                              <div
                                className={`h-5 w-5 rounded flex items-center justify-center border transition-all shrink-0 ${
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
                                className={`text-sm truncate ${
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
                                className="opacity-0 group-hover:opacity-100 sm:opacity-0 max-sm:opacity-100 p-1 text-[#868686] hover:text-[#ffffff] rounded hover:bg-[#444444] transition-opacity"
                                title="Task options"
                                aria-label={`Options for task ${task.text}`}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center">
            <Button
              type="button"
              onClick={() => {
                setAddModalType("daily");
                setSelectedCategory(dailyCategoryOptions[0] || "Category 1");
              }}
              className="h-10 px-6 rounded-full bg-[#ffffff] text-[#000000] text-xs font-bold hover:bg-[#e0e0e0] shadow-sm inline-flex items-center gap-1.5"
            >
              Add more todos
            </Button>
          </div>
        </div>

        {/* Weekly Todos */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-md flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#ffffff]">Weekly Todos</h3>
              <span className="text-xs font-semibold text-[#d2d2d2]">
                {completedWeeklyTasks}/{totalWeeklyTasks} Completed
              </span>
            </div>

            <div className="space-y-3">
              {weeklyCategories.map((cat, catIdx) => (
                <div
                  key={cat.name}
                  className="rounded-xl bg-[#292929] overflow-hidden border border-[#333333]"
                >
                  <div
                    onContextMenu={(e) => handleCategoryContextMenu(e, cat, "weekly")}
                    onClick={() => toggleWeeklyCollapse(catIdx)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm text-[#ffffff] hover:bg-[#333333] transition-colors cursor-pointer select-none"
                  >
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
                        cat.tasks.map((task) => (
                          <div
                            key={task.id}
                            onContextMenu={(e) =>
                              handleTaskContextMenu(e, task, catIdx, "weekly")
                            }
                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#383838] transition-colors group"
                          >
                            <div
                              onClick={() => toggleWeeklyTask(catIdx, task.id)}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                            >
                              <div
                                className={`h-5 w-5 rounded flex items-center justify-center border transition-all shrink-0 ${
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
                                className={`text-sm truncate ${
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
                                className="opacity-0 group-hover:opacity-100 sm:opacity-0 max-sm:opacity-100 p-1 text-[#868686] hover:text-[#ffffff] rounded hover:bg-[#444444] transition-opacity"
                                title="Task options"
                                aria-label={`Options for task ${task.text}`}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center">
            <Button
              type="button"
              onClick={() => {
                setAddModalType("weekly");
                setSelectedCategory(weeklyCategoryOptions[0] || "Category 1");
              }}
              className="h-10 px-6 rounded-full bg-[#ffffff] text-[#000000] text-xs font-bold hover:bg-[#e0e0e0] shadow-sm inline-flex items-center gap-1.5"
            >
              Add more todos
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
                      value={selectedCategory}
                      onChange={(e) => {
                        if (e.target.value === "__NEW__") {
                          setIsCreatingCategory(true);
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
                      type="text"
                      placeholder="Category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="h-11 bg-[#545454] border-[#484848] text-[#f4f3f6] rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreatingCategory(false)}
                      className="h-11 border-[#484848] text-xs text-[#ffffff]"
                    >
                      Back
                    </Button>
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
