import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CockpitTasksSection } from "./cockpit-tasks-section";
import type { UserCategorizedTasks } from "@/features/tasks/domain/task.types";

vi.mock("@/features/tasks/api/task.actions", () => ({
  createTaskAction: vi.fn(),
  deleteTaskAction: vi.fn(),
  toggleTaskAction: vi.fn(),
  updateTaskAction: vi.fn(),
  updateCategoryAction: vi.fn(),
  deleteCategoryAction: vi.fn(),
}));

describe("CockpitTasksSection", () => {
  const mockTasks: UserCategorizedTasks = {
    categories: [
      {
        id: "cat_daily_1",
        userId: "user_1",
        name: "Daily Routines",
        taskType: "DAILY",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat_weekly_1",
        userId: "user_1",
        name: "Sprint Deliverables",
        taskType: "WEEKLY",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    dailyCategories: [
      {
        id: "cat_daily_1",
        name: "Daily Routines",
        taskType: "DAILY",
        isCollapsed: false,
        tasks: [
          {
            id: "t_1",
            userId: "user_1",
            categoryId: "cat_daily_1",
            title: "Study Chemistry Chapter 2",
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
        id: "cat_weekly_1",
        name: "Sprint Deliverables",
        taskType: "WEEKLY",
        isCollapsed: false,
        tasks: [
          {
            id: "t_2",
            userId: "user_1",
            categoryId: "cat_weekly_1",
            title: "Physics Problem Set",
            taskType: "WEEKLY",
            isComplete: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt: new Date(),
          },
        ],
      },
    ],
    totalDailyTasks: 1,
    completedDailyTasks: 0,
    totalWeeklyTasks: 1,
    completedWeeklyTasks: 1,
  };

  it("renders tasks and category options trigger buttons when user is logged in", () => {
    const html = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: mockTasks,
      }),
    );

    expect(html).toContain("Daily Todos");
    expect(html).toContain("Weekly Todos");
    expect(html).toContain("Daily Routines");
    expect(html).toContain("Sprint Deliverables");
    expect(html).toContain("Study Chemistry Chapter 2");
    expect(html).toContain("Physics Problem Set");
    expect(html).toContain('aria-label="Options for category Daily Routines"');
    expect(html).toContain('aria-label="Options for category Sprint Deliverables"');
    expect(html).toContain(
      'aria-label="Options for task Study Chemistry Chapter 2"',
    );
  });

  it("does not render options trigger buttons when user is not logged in", () => {
    const html = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: false,
        userTasks: mockTasks,
      }),
    );

    expect(html).toContain("Daily Routines");
    expect(html).toContain("Sprint Deliverables");
    expect(html).not.toContain('aria-label="Options for category Daily Routines"');
    expect(html).not.toContain('aria-label="Options for category Sprint Deliverables"');
    expect(html).not.toContain(
      'aria-label="Options for task Study Chemistry Chapter 2"',
    );
  });

  it("strictly segregates daily and weekly categories without cross-contamination", () => {
    const html = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: mockTasks,
      }),
    );

    const [dailySection, weeklySection] = html.split("Weekly Todos");

    // Daily Routines exists only in daily section
    expect(dailySection).toContain("Daily Routines");
    expect(weeklySection).not.toContain("Daily Routines");

    // Sprint Deliverables exists only in weekly section
    expect(weeklySection).toContain("Sprint Deliverables");
    expect(dailySection).not.toContain("Sprint Deliverables");
  });

  it("renders status indicator badges and accessible checkbox controls for tasks", () => {
    const html = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: mockTasks,
      }),
    );

    // Uncompleted / To-Do daily task has clean row without "Incomplete" badge
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('aria-checked="false"');
    expect(html).not.toContain("Incomplete");

    // Completed weekly task
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("Completed");
  });

  it("renders In Progress and Crossed Out status badges appropriately", () => {
    const customTasks: UserCategorizedTasks = {
      ...mockTasks,
      dailyCategories: [
        {
          id: "cat_daily_status",
          name: "Status Tests",
          taskType: "DAILY",
          isCollapsed: false,
          tasks: [
            {
              id: "t_prog",
              userId: "user_1",
              categoryId: "cat_daily_status",
              title: "Active Working Task",
              taskType: "DAILY",
              isComplete: false,
              status: "IN_PROGRESS",
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: null,
            },
            {
              id: "t_cross",
              userId: "user_1",
              categoryId: "cat_daily_status",
              title: "Blocked Task",
              taskType: "DAILY",
              isComplete: false,
              status: "CROSSED_OUT",
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: null,
            },
          ],
        },
      ],
    };

    const html = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: customTasks,
      }),
    );

    expect(html).toContain("In Progress");
    expect(html).toContain("Crossed Out");
    expect(html).not.toContain("Incomplete");
  });

  it("renders full 7-day pill switcher tabs with challenge days for all users (participants and admins)", () => {
    const html = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: mockTasks,
        challengeStartDate: "2026-10-01T00:00:00Z",
        todayDate: "2026-10-03",
        todayDayNumber: 3,
        totalChallengeDays: 7,
        isAdmin: false,
      }),
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Challenge Day Tabs"');
    expect(html).toContain("D1");
    expect(html).toContain("D2");
    expect(html).toContain("Today");
    expect(html).toContain("D4");
    expect(html).toContain("D7");
  });

  it("renders day number instead of 'Yesterday' in 7-day switcher to prevent text overlap", () => {
    const html = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: mockTasks,
        challengeStartDate: "2026-10-01T00:00:00Z",
        todayDate: "2026-10-03",
        todayDayNumber: 3,
        totalChallengeDays: 7,
      }),
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain("D1");
    expect(html).toContain("D2");
    expect(html).toContain("Today");
    expect(html).toContain("D4");
    expect(html).toContain("D7");
    expect(html).not.toMatch(/>\s*Yesterday\s*</i);
  });

  it("filters daily tasks according to the active challenge day", () => {
    const multiDayTasks: UserCategorizedTasks = {
      ...mockTasks,
      dailyCategories: [
        {
          id: "cat_daily_days",
          name: "Study Blocks",
          taskType: "DAILY",
          isCollapsed: false,
          tasks: [
            {
              id: "t_day1",
              userId: "user_1",
              categoryId: "cat_daily_days",
              title: "Day 1 Calculus Prep",
              taskType: "DAILY",
              isComplete: false,
              dueDate: "2026-10-01",
              createdAt: new Date("2026-10-01T10:00:00Z"),
              updatedAt: new Date("2026-10-01T10:00:00Z"),
              completedAt: null,
            },
            {
              id: "t_day2",
              userId: "user_1",
              categoryId: "cat_daily_days",
              title: "Day 2 Organic Chemistry",
              taskType: "DAILY",
              isComplete: false,
              dueDate: "2026-10-02",
              createdAt: new Date("2026-10-02T10:00:00Z"),
              updatedAt: new Date("2026-10-02T10:00:00Z"),
              completedAt: null,
            },
          ],
        },
      ],
    };

    // When viewing Day 1 (todayDate = 2026-10-01)
    const htmlDay1 = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: multiDayTasks,
        challengeStartDate: "2026-10-01T00:00:00Z",
        todayDate: "2026-10-01",
        todayDayNumber: 1,
        totalChallengeDays: 7,
      }),
    );

    expect(htmlDay1).toContain("Day 1 Calculus Prep");
    expect(htmlDay1).not.toContain("Day 2 Organic Chemistry");
  });

  it("does not shift a task to the current day when created today with dueDate set to another day", () => {
    const tasksAddedForOtherDay: UserCategorizedTasks = {
      ...mockTasks,
      dailyCategories: [
        {
          id: "cat_daily_days",
          name: "Study Blocks",
          taskType: "DAILY",
          isCollapsed: false,
          tasks: [
            {
              id: "t_created_today_for_tomorrow",
              userId: "user_1",
              categoryId: "cat_daily_days",
              title: "Tomorrow Physics Exam Review",
              taskType: "DAILY",
              isComplete: false,
              // Created today (2026-10-01), but scheduled for tomorrow (2026-10-02)
              dueDate: "2026-10-02",
              createdAt: new Date("2026-10-01T08:00:00Z"),
              updatedAt: new Date("2026-10-01T08:00:00Z"),
              completedAt: null,
            },
          ],
        },
      ],
    };

    // Viewing Day 1 (todayDate = 2026-10-01)
    const htmlDay1 = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: tasksAddedForOtherDay,
        challengeStartDate: "2026-10-01T00:00:00Z",
        todayDate: "2026-10-01",
        todayDayNumber: 1,
        totalChallengeDays: 7,
      }),
    );

    // Should NOT be rendered on Day 1 (Today)
    expect(htmlDay1).not.toContain("Tomorrow Physics Exam Review");
    expect(htmlDay1).toContain("No todos scheduled for");
  });

  it("renders empty day state when no tasks are scheduled for the active day", () => {
    const emptyDayTasks: UserCategorizedTasks = {
      ...mockTasks,
      dailyCategories: [
        {
          id: "cat_daily_days",
          name: "Study Blocks",
          taskType: "DAILY",
          isCollapsed: false,
          tasks: [
            {
              id: "t_day5",
              userId: "user_1",
              categoryId: "cat_daily_days",
              title: "Day 5 Biology",
              taskType: "DAILY",
              isComplete: false,
              dueDate: "2026-10-05",
              createdAt: new Date("2026-10-05T10:00:00Z"),
              updatedAt: new Date("2026-10-05T10:00:00Z"),
              completedAt: null,
            },
          ],
        },
      ],
    };

    // Viewing Day 1 (2026-10-01), but task is only on Day 5
    const html = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: emptyDayTasks,
        challengeStartDate: "2026-10-01T00:00:00Z",
        todayDate: "2026-10-01",
        todayDayNumber: 1,
        totalChallengeDays: 7,
      }),
    );

    expect(html).toContain("No todos scheduled for");
    expect(html).toContain("+ Add todo for");
  });

  it("does not render clock time logging button in tasks section header", () => {
    const openHoursModal = vi.fn();
    const html = renderToStaticMarkup(
      createElement(CockpitTasksSection, {
        isLoggedIn: true,
        userTasks: mockTasks,
        onOpenHoursModal: openHoursModal,
      }),
    );

    expect(html).not.toContain('aria-label="Log study hours for');
  });
});

