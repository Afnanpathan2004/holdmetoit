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
});
