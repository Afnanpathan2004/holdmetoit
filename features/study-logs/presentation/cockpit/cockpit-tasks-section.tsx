"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
} from "@/features/tasks/api/task.actions";
import type { UserCategorizedTasks } from "@/features/tasks/domain/task.types";

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
  userTasks?: UserCategorizedTasks | null;
}

export function CockpitTasksSection({
  isLoggedIn,
  userTasks,
}: CockpitTasksSectionProps) {
  const [, startTransition] = useTransition();
  const [addModalType, setAddModalType] = useState<"daily" | "weekly" | null>(null);
  const [newTodoText, setNewTodoText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Category 1");
  const [customCategory, setCustomCategory] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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

  const categoryOptions = Array.from(
    new Set([
      ...(userTasks?.categories?.map((c) => c.name) ?? []),
      ...dailyCategories.map((c) => c.name),
      ...weeklyCategories.map((c) => c.name),
      "Category 1",
    ]),
  );

  const categoryNameToId = new Map(
    userTasks?.categories?.map((c) => [c.name, c.id]) ?? [],
  );

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

    if (isLoggedIn) {
      startTransition(async () => {
        await toggleTaskAction({ taskId, isComplete: nextCompleted });
      });
    }
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

    if (isLoggedIn) {
      startTransition(async () => {
        await toggleTaskAction({ taskId, isComplete: nextCompleted });
      });
    }
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

    if (isLoggedIn) {
      startTransition(async () => {
        await deleteTaskAction({ taskId });
      });
    }
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

    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
    };

    if (addModalType === "daily") {
      setDailyCategories((prev) => {
        const existingIndex = prev.findIndex((c) => c.name === targetCategoryName);
        if (existingIndex >= 0) {
          return prev.map((cat, i) =>
            i === existingIndex
              ? { ...cat, isCollapsed: false, tasks: [...cat.tasks, newTask] }
              : cat
          );
        } else {
          return [
            ...prev,
            { name: targetCategoryName, isCollapsed: false, tasks: [newTask] },
          ];
        }
      });
    } else {
      setWeeklyCategories((prev) => {
        const existingIndex = prev.findIndex((c) => c.name === targetCategoryName);
        if (existingIndex >= 0) {
          return prev.map((cat, i) =>
            i === existingIndex
              ? { ...cat, isCollapsed: false, tasks: [...cat.tasks, newTask] }
              : cat
          );
        } else {
          return [
            ...prev,
            { name: targetCategoryName, isCollapsed: false, tasks: [newTask] },
          ];
        }
      });
    }

    if (isLoggedIn) {
      startTransition(async () => {
        await createTaskAction({
          title: newTodoText.trim(),
          taskType,
          newCategoryName: isNew ? customCategory.trim() : undefined,
          categoryId: !isNew ? categoryNameToId.get(selectedCategory) : undefined,
        });
      });
    }

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
                  <button
                    type="button"
                    onClick={() => toggleDailyCollapse(catIdx)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm text-[#ffffff] hover:bg-[#333333] transition-colors"
                  >
                    <span>{cat.name}</span>
                    {cat.isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-[#868686]" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-[#868686]" />
                    )}
                  </button>

                  {!cat.isCollapsed && (
                    <div className="px-4 pb-3 pt-1 space-y-2.5 border-t border-[#383838]">
                      {cat.tasks.length === 0 ? (
                        <p className="text-xs text-[#868686] py-1">No daily tasks in this category.</p>
                      ) : (
                        cat.tasks.map((task) => (
                          <div
                            key={task.id}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(catIdx, task.id, "daily");
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#868686] hover:text-red-400 transition-opacity"
                                title="Delete task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
              onClick={() => setAddModalType("daily")}
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
                  <button
                    type="button"
                    onClick={() => toggleWeeklyCollapse(catIdx)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm text-[#ffffff] hover:bg-[#333333] transition-colors"
                  >
                    <span>{cat.name}</span>
                    {cat.isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-[#868686]" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-[#868686]" />
                    )}
                  </button>

                  {!cat.isCollapsed && (
                    <div className="px-4 pb-3 pt-1 space-y-2.5 border-t border-[#383838]">
                      {cat.tasks.length === 0 ? (
                        <p className="text-xs text-[#868686] py-1">No weekly tasks in this category.</p>
                      ) : (
                        cat.tasks.map((task) => (
                          <div
                            key={task.id}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(catIdx, task.id, "weekly");
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#868686] hover:text-red-400 transition-opacity"
                                title="Delete task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
              onClick={() => setAddModalType("weekly")}
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
                      {categoryOptions.map((catName) => (
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
    </>
  );
}
