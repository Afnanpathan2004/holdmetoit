"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Check, X, Calendar, Trophy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DailyHoursModal } from "./daily-hours-modal";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
} from "@/features/tasks/api/task.actions";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";
import {
  determineBannerVariant,
  formatOrdinalRank,
  formatStudiedTodayHours,
} from "@/features/study-logs/domain/cockpit-banner";
import { JoinChallengeModal } from "@/features/challenges/presentation/join-challenge-modal";
import type { CockpitViewModel } from "@/features/study-logs/data/cockpit-data";
import type { UserCategorizedTasks } from "@/features/tasks/domain/task.types";

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

interface CategoryGroup {
  id?: string;
  name: string;
  isCollapsed: boolean;
  tasks: TaskItem[];
}

interface HomeCockpitViewProps {
  displayName?: string;
  challengeId?: string;
  todayLoggedSeconds?: number;
  todayLoggedClock?: string;
  user?: {
    id?: string;
    name?: string | null;
    displayName?: string | null;
    username?: string | null;
    image?: string | null;
  } | null;
  cockpit?: CockpitViewModel | null;
  upcomingChallenge?: {
    id: string;
    title: string;
    format: "TEAM_VS_TEAM" | "DUOS" | "SOLOS";
    teams?: Array<{
      id: string;
      name: string;
      color: string | null;
      iconEmoji: string | null;
    }>;
  } | null;
  userTasks?: UserCategorizedTasks | null;
}

export function HomeCockpitView({
  displayName = "Unauthenticated",
  challengeId = "seed-honey-bees-vs-lavender-butterflies",
  todayLoggedSeconds = 0,
  todayLoggedClock = "00:00:00",
  user,
  cockpit,
  upcomingChallenge,
  userTasks,
}: HomeCockpitViewProps) {
  const [isPending, startTransition] = useTransition();
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [hoursModalDate, setHoursModalDate] = useState<string | undefined>(undefined);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<"daily" | "weekly" | null>(null);
  const [newTodoText, setNewTodoText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Category 1");
  const [customCategory, setCustomCategory] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const openHoursModal = (date?: string) => {
    setHoursModalDate(date);
    setIsHoursModalOpen(true);
  };

  const activeChallengeId = cockpit?.challengeId ?? challengeId;
  const effectiveDisplayName =
    cockpit?.participant.displayName ||
    cockpit?.participant.username ||
    displayName;

  const isLoggedIn = Boolean(
    (user && (user.id || user.name || user.username)) || cockpit?.participant.userId,
  );

  const effectiveTodaySeconds = cockpit ? cockpit.todayLoggedSeconds : todayLoggedSeconds;
  const effectiveTodayClock = cockpit ? cockpit.todayLoggedClock : todayLoggedClock;
  const effectiveTargetSeconds = cockpit?.targetSeconds ?? 0;
  const effectiveTargetClock = cockpit?.targetClock ?? "00:00:00";
  const effectiveTotalLoggedSeconds = cockpit?.totalLoggedSeconds ?? 0;
  const effectiveTotalLoggedClock = cockpit?.totalLoggedClock ?? "00:00:00";

  const effectiveUserTasks = userTasks ?? cockpit?.userTasks;

  const [dailyCategories, setDailyCategories] = useState<CategoryGroup[]>(() => {
    if (effectiveUserTasks?.dailyCategories && effectiveUserTasks.dailyCategories.length > 0) {
      return effectiveUserTasks.dailyCategories.map((c) => ({
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
    if (effectiveUserTasks?.weeklyCategories && effectiveUserTasks.weeklyCategories.length > 0) {
      return effectiveUserTasks.weeklyCategories.map((c) => ({
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
      ...(effectiveUserTasks?.categories?.map((c) => c.name) ?? []),
      ...dailyCategories.map((c) => c.name),
      ...weeklyCategories.map((c) => c.name),
      "Category 1",
    ]),
  );

  const categoryNameToId = new Map(
    effectiveUserTasks?.categories?.map((c) => [c.name, c.id]) ?? [],
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

  const hasLoggedToday = effectiveTodaySeconds > 0;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const progressPercent =
    effectiveTargetSeconds > 0
      ? Math.min(
          100,
          Math.round((effectiveTotalLoggedSeconds / effectiveTargetSeconds) * 100),
        )
      : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#ffffff] tracking-tight">
            Welcome {effectiveDisplayName}
          </h1>
          <p className="text-sm font-medium text-[#868686] mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </p>
        </div>
      </div>

      {/* Dynamic Cockpit Banner Card (Variants 1–7 from Figma mockup) */}
      {isLoggedIn && (() => {
        const isEnrolledInChallenge = Boolean(cockpit);
        const activeChallengeStatus = cockpit?.challengeStatus ?? (upcomingChallenge ? "UPCOMING" : null);
        const activeChallengeFormat = cockpit?.challengeFormat ?? upcomingChallenge?.format ?? "TEAM_VS_TEAM";
        const todayDateString = cockpit?.todayDate || new Date().toISOString().slice(0, 10);
        const yesterdayDateString = cockpit?.yesterdayDate;
        const targetChallengeId = upcomingChallenge?.id ?? activeChallengeId;

        const bannerVariant = determineBannerVariant({
          isEnrolled: isEnrolledInChallenge,
          challengeStatus: activeChallengeStatus,
          challengeFormat: activeChallengeFormat,
          todayLoggedSeconds: effectiveTodaySeconds,
          isYesterdayMissed: cockpit?.isYesterdayMissed ?? false,
        });

        if (bannerVariant === "STUDIED_TODAY") {
          return (
            <div className="rounded-2xl border border-[#1e6b35]/40 bg-[#0f4a24] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#ffffff] tracking-tight">
                  Wow, you studied {formatStudiedTodayHours(effectiveTodaySeconds)} today
                </h3>
                <p className="text-xs sm:text-sm text-[#d1d1d1] mt-1">
                  Work hard, stay consistent, and keep your team on top
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 px-5 rounded-full border border-white text-white bg-transparent hover:bg-white/10 text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Link href={`/challenge/${activeChallengeId}?tab=leaderboard`}>
                    View Leaderboard
                  </Link>
                </Button>
                <Button
                  type="button"
                  onClick={() => openHoursModal(todayDateString)}
                  className="h-10 px-5 rounded-full bg-white text-black hover:bg-[#e0e0e0] text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  Log Today&apos;s Hours
                </Button>
              </div>
            </div>
          );
        }

        if (bannerVariant === "NOT_LOGGED_TODAY") {
          return (
            <div className="rounded-2xl border border-[#6b3020]/40 bg-[#451f15] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#ffffff] tracking-tight">
                  You haven&apos;t logged today&apos;s hours
                </h3>
                <p className="text-xs sm:text-sm text-[#d1d1d1] mt-1">
                  Work hard, stay consistent, and keep your team on top
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 px-5 rounded-full border border-white text-white bg-transparent hover:bg-white/10 text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Link href={`/challenge/${activeChallengeId}?tab=leaderboard`}>
                    View Leaderboard
                  </Link>
                </Button>
                <Button
                  type="button"
                  onClick={() => openHoursModal(todayDateString)}
                  className="h-10 px-5 rounded-full bg-white text-black hover:bg-[#e0e0e0] text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  Log Today&apos;s Hours
                </Button>
              </div>
            </div>
          );
        }

        if (bannerVariant === "FORGOT_YESTERDAY") {
          return (
            <div className="rounded-2xl border border-[#942626]/40 bg-[#6b1818] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#ffffff] tracking-tight">
                  Don&apos;t forget yesterday&apos;s hard work!
                </h3>
                <p className="text-xs sm:text-sm text-[#d1d1d1] mt-1">
                  Log it as leave and get right back into the challenge today
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  type="button"
                  onClick={() => openHoursModal(yesterdayDateString)}
                  className="h-10 px-5 rounded-full bg-white text-black hover:bg-[#e0e0e0] text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  Log Yesterday Hours
                </Button>
              </div>
            </div>
          );
        }

        if (bannerVariant === "CHALLENGE_COMPLETED") {
          return (
            <div className="rounded-2xl border border-[#237599]/40 bg-[#16536e] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#ffffff] tracking-tight">
                  Congrats, your team secured {formatOrdinalRank(cockpit?.teamRank ?? 1)} in this challenge
                </h3>
                <p className="text-xs sm:text-sm text-[#d1d1d1] mt-1">
                  Work hard, stay consistent, and come stronger next time
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  asChild
                  className="h-10 px-5 rounded-full bg-white text-black hover:bg-[#e0e0e0] text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  <Link href={`/challenge/${activeChallengeId}?tab=leaderboard`}>
                    View Leaderboard
                  </Link>
                </Button>
              </div>
            </div>
          );
        }

        if (bannerVariant === "ENROLL_SOLO") {
          return (
            <div className="rounded-2xl border border-[#3e2475]/40 bg-[#251744] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#ffffff] tracking-tight">
                  Enroll in solo battle this week
                </h3>
                <p className="text-xs sm:text-sm text-[#d1d1d1] mt-1">
                  Work hard, stay consistent, and keep your team on top
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 px-5 rounded-full border border-white text-white bg-transparent hover:bg-white/10 text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Link href={`/challenge/${targetChallengeId}`}>
                    View
                  </Link>
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="h-10 px-5 rounded-full bg-white text-black hover:bg-[#e0e0e0] text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  Enroll
                </Button>
              </div>
            </div>
          );
        }

        if (bannerVariant === "ENROLL_GROUP") {
          return (
            <div className="rounded-2xl border border-[#3e2475]/40 bg-[#251744] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#ffffff] tracking-tight">
                  Enroll in group battle this week
                </h3>
                <p className="text-xs sm:text-sm text-[#d1d1d1] mt-1">
                  Work hard, stay consistent, and keep your team on top
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 px-5 rounded-full border border-white text-white bg-transparent hover:bg-white/10 text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Link href={`/challenge/${targetChallengeId}`}>
                    View
                  </Link>
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="h-10 px-5 rounded-full bg-white text-black hover:bg-[#e0e0e0] text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  Enroll
                </Button>
              </div>
            </div>
          );
        }

        if (bannerVariant === "ENROLL_DUO") {
          return (
            <div className="rounded-2xl border border-[#3e2475]/40 bg-[#251744] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#ffffff] tracking-tight">
                  Enroll in duo battle this week
                </h3>
                <p className="text-xs sm:text-sm text-[#d1d1d1] mt-1">
                  Work hard, stay consistent, and keep your team on top
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 px-5 rounded-full border border-white text-white bg-transparent hover:bg-white/10 text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Link href={`/challenge/${targetChallengeId}`}>
                    View
                  </Link>
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="h-10 px-5 rounded-full bg-white text-black hover:bg-[#e0e0e0] text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  Enroll
                </Button>
              </div>
            </div>
          );
        }

        // ENROLLED_UPCOMING
        return (
          <div className="rounded-2xl border border-[#3e2475]/40 bg-[#251744] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#ffffff] tracking-tight">
                {activeChallengeFormat === "SOLOS"
                  ? "You are enrolled in solo battle this week"
                  : activeChallengeFormat === "DUOS"
                    ? "You are enrolled in duo battle this week"
                    : "You are enrolled in group battle this week"}
              </h3>
              <p className="text-xs sm:text-sm text-[#d1d1d1] mt-1">
                Work hard, stay consistent, and keep your team on top
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                asChild
                variant="outline"
                className="h-10 px-5 rounded-full border border-white text-white bg-transparent hover:bg-white/10 text-xs sm:text-sm font-semibold transition-colors"
              >
                <Link href={`/challenge/${activeChallengeId}`}>
                  View
                </Link>
              </Button>
              <Button
                disabled
                className="h-10 px-5 rounded-full bg-white/80 text-black text-xs sm:text-sm font-bold opacity-90 cursor-default"
              >
                Enrolled ✓
              </Button>
            </div>
          </div>
        );
      })()}

      {cockpit && effectiveTargetSeconds > 0 && (
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#868686]">
                Weekly Commitment Progress
              </span>
              <p className="text-xl font-bold text-[#ffffff] mt-0.5">
                <span className="font-sans font-sans-tabular">{effectiveTotalLoggedClock}</span>
                <span className="text-sm font-normal text-[#868686]"> / {effectiveTargetClock}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {cockpit.catchUp && cockpit.catchUp.deficitSeconds > 0 ? (
                <div className="rounded-xl border border-[#ef4444]/40 bg-[#401010] px-3 py-1.5 text-xs text-[#ff5757]">
                  <span className="font-semibold">Deficit:</span>{" "}
                  <span className="font-sans font-sans-tabular">-{formatSecondsToClock(Math.round(cockpit.catchUp.deficitSeconds))}</span>
                  {cockpit.catchUp.paceSecondsPerDay ? (
                    <> (need <span className="font-sans font-sans-tabular">{formatSecondsToClock(Math.round(cockpit.catchUp.paceSecondsPerDay))}</span>/day)</>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-[#22c55e]/40 bg-[#144520] px-3 py-1.5 text-xs text-[#85ff93] font-semibold">
                  Pace on Target
                </div>
              )}
              <span className="text-sm font-bold text-[#ffffff]">{progressPercent}%</span>
            </div>
          </div>

          <div className="h-2.5 w-full rounded-full bg-[#292929] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent >= 100
                  ? "bg-[#22c55e]"
                  : cockpit.catchUp && cockpit.catchUp.deficitSeconds > 0
                    ? "bg-[#ef4444]"
                    : "bg-[#ffffff]"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

      <DailyHoursModal
        key={hoursModalDate ?? "today"}
        challengeId={activeChallengeId}
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        todayDate={cockpit?.todayDate || new Date().toISOString().slice(0, 10)}
        yesterdayDate={cockpit?.yesterdayDate}
        initialDate={hoursModalDate}
      />

      {isLoggedIn && (upcomingChallenge || cockpit) && (
        <JoinChallengeModal
          challengeId={upcomingChallenge?.id ?? activeChallengeId}
          challengeTitle={upcomingChallenge?.title ?? cockpit?.challengeTitle ?? "Challenge"}
          format={upcomingChallenge?.format ?? cockpit?.challengeFormat}
          teams={upcomingChallenge?.teams}
          isOpen={isEnrollModalOpen}
          onOpenChange={setIsEnrollModalOpen}
          showTrigger={false}
        />
      )}
    </div>
  );
}
