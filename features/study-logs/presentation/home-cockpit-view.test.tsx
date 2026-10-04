import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HomeCockpitView } from "./home-cockpit-view";
import type { CockpitViewModel } from "@/features/study-logs/data/cockpit-data";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    createElement("a", { href, className }, children),
}));

vi.mock("@/features/challenges/presentation/join-challenge-modal", () => ({
  JoinChallengeModal: () => null,
}));

vi.mock("./daily-hours-modal", () => ({
  DailyHoursModal: () => null,
}));

vi.mock("@/features/tasks/api/task.actions", () => ({
  createTaskAction: vi.fn(),
  deleteTaskAction: vi.fn(),
  toggleTaskAction: vi.fn(),
}));

describe("HomeCockpitView", () => {
  it("renders correctly with fractional paceSecondsPerDay without throwing DurationRangeError", () => {
    const mockCockpit: CockpitViewModel = {
      challengeId: "chal-1",
      challengeTitle: "October Group Battle",
      challengeStatus: "ACTIVE",
      challengeFormat: "TEAM_VS_TEAM",
      teamName: "Honey Bees",
      teamIcon: "🐝",
      participant: {
        id: "part-1",
        userId: "user-1",
        displayName: "Afnan",
        username: "afnan6969",
        image: null,
      },
      targetSeconds: 126000,
      targetClock: "35:00:00",
      totalLoggedSeconds: 18000,
      totalLoggedClock: "05:00:00",
      canEditDeclarations: false,
      canLogStudyTime: true,
      isReadOnly: false,
      userTasks: {
        categories: [{ id: "cat-1", userId: "user-1", name: "Deep Work", createdAt: new Date(), updatedAt: new Date() }],
        dailyCategories: [
          {
            id: "cat-1",
            name: "Deep Work",
            isCollapsed: false,
            tasks: [
              {
                id: "t-1",
                userId: "user-1",
                categoryId: "cat-1",
                title: "Study Physics",
                taskType: "DAILY",
                isComplete: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                completedAt: null,
              },
            ],
          },
        ],
        weeklyCategories: [
          {
            id: "cat-1",
            name: "Deep Work",
            isCollapsed: false,
            tasks: [],
          },
        ],
        totalDailyTasks: 1,
        completedDailyTasks: 0,
        totalWeeklyTasks: 0,
        completedWeeklyTasks: 0,
      },
      logs: [],
      catchUp: {
        tone: "catch-up",
        deficitSeconds: 108000,
        // Fractional quotient: 108000 / 7 = 15428.571428571428
        paceSecondsPerDay: 108000 / 7,
        progressLabel: "05:00:00 / 35:00:00",
        message: "Gentle catch-up.",
      },
      todayDate: "2026-10-04",
      todayLoggedSeconds: 18000,
      todayLoggedClock: "05:00:00",
      yesterdayDate: "2026-10-03",
      yesterdayLoggedSeconds: 0,
      isYesterdayMissed: false,
      teamRank: null,
      remainingDailyAllowanceSeconds: 68400,
    };

    expect(() => {
      const html = renderToStaticMarkup(
        createElement(HomeCockpitView, {
          cockpit: mockCockpit,
          user: { id: "user-1", name: "Afnan", displayName: "Afnan" },
          displayName: "Afnan",
        }),
      );
      expect(html).toContain("Deficit:");
      expect(html).toContain("04:17:09"); // 15429 seconds (Math.round(108000/7)) formatted cleanly to HH:MM:SS
      expect(html).toContain("Deep Work");
      expect(html).toContain("Study Physics");
    }).not.toThrow();
  });

  it("hides Weekly Commitment Progress when challengeStatus is COMPLETED", () => {
    const mockCockpit: CockpitViewModel = {
      challengeId: "chal-1",
      challengeTitle: "October Group Battle",
      challengeStatus: "COMPLETED",
      challengeFormat: "TEAM_VS_TEAM",
      teamName: "Honey Bees",
      teamIcon: "🐝",
      participant: {
        id: "part-1",
        userId: "user-1",
        displayName: "Afnan",
        username: "afnan6969",
        image: null,
      },
      targetSeconds: 126000,
      targetClock: "35:00:00",
      totalLoggedSeconds: 25200,
      totalLoggedClock: "07:00:00",
      canEditDeclarations: false,
      canLogStudyTime: false,
      isReadOnly: true,
      userTasks: {
        categories: [],
        dailyCategories: [],
        weeklyCategories: [],
        totalDailyTasks: 0,
        completedDailyTasks: 0,
        totalWeeklyTasks: 0,
        completedWeeklyTasks: 0,
      },
      logs: [],
      catchUp: {
        tone: "deadline",
        deficitSeconds: 100800,
        paceSecondsPerDay: null,
        progressLabel: "07:00:00 / 35:00:00",
        message: "Challenge completed.",
      },
      todayDate: "2026-10-04",
      todayLoggedSeconds: 0,
      todayLoggedClock: "00:00:00",
      yesterdayDate: "2026-10-03",
      yesterdayLoggedSeconds: 0,
      isYesterdayMissed: false,
      teamRank: 1,
      remainingDailyAllowanceSeconds: 86400,
    };

    const html = renderToStaticMarkup(
      createElement(HomeCockpitView, {
        cockpit: mockCockpit,
        user: { id: "user-1", name: "Afnan", displayName: "Afnan" },
        displayName: "Afnan",
      }),
    );

    expect(html).toContain("Congrats, your team secured 1st in this challenge");
    expect(html).not.toContain("Weekly Commitment Progress");
  });

  it("hides Weekly Commitment Progress when challengeStatus is UPCOMING", () => {
    const mockCockpit: CockpitViewModel = {
      challengeId: "chal-1",
      challengeTitle: "October Group Battle",
      challengeStatus: "UPCOMING",
      challengeFormat: "TEAM_VS_TEAM",
      teamName: "Honey Bees",
      teamIcon: "🐝",
      participant: {
        id: "part-1",
        userId: "user-1",
        displayName: "Afnan",
        username: "afnan6969",
        image: null,
      },
      targetSeconds: 126000,
      targetClock: "35:00:00",
      totalLoggedSeconds: 0,
      totalLoggedClock: "00:00:00",
      canEditDeclarations: true,
      canLogStudyTime: false,
      isReadOnly: false,
      userTasks: {
        categories: [],
        dailyCategories: [],
        weeklyCategories: [],
        totalDailyTasks: 0,
        completedDailyTasks: 0,
        totalWeeklyTasks: 0,
        completedWeeklyTasks: 0,
      },
      logs: [],
      catchUp: {
        tone: "on-pace",
        deficitSeconds: 126000,
        paceSecondsPerDay: null,
        progressLabel: "00:00:00 / 35:00:00",
        message: "Upcoming challenge.",
      },
      todayDate: "2026-10-04",
      todayLoggedSeconds: 0,
      todayLoggedClock: "00:00:00",
      yesterdayDate: "2026-10-03",
      yesterdayLoggedSeconds: 0,
      isYesterdayMissed: false,
      teamRank: null,
      remainingDailyAllowanceSeconds: 86400,
    };

    const html = renderToStaticMarkup(
      createElement(HomeCockpitView, {
        cockpit: mockCockpit,
        user: { id: "user-1", name: "Afnan", displayName: "Afnan" },
        displayName: "Afnan",
      }),
    );

    expect(html).toContain("You are enrolled in group battle this week");
    expect(html).not.toContain("Weekly Commitment Progress");
  });

  it("renders guest view gracefully when user is not logged in", () => {
    const html = renderToStaticMarkup(
      createElement(HomeCockpitView, {
        user: null,
        cockpit: null,
        displayName: "Guest",
      }),
    );
    expect(html).toContain("Daily Todos");
    expect(html).toContain("Weekly Todos");
  });
});
