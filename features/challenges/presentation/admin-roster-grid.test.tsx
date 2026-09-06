import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { vi } from "vitest";
import { AdminRosterGrid } from "./admin-roster-grid";

vi.mock("@/features/study-logs/api/study-log-override.action", () => ({
  overrideStudyHoursAction: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/features/declarations/api/admin-goal.actions", () => ({
  adminAddGoalAction: vi.fn().mockResolvedValue({ ok: true, goalId: "g-new" }),
  adminEditGoalAction: vi.fn().mockResolvedValue({ ok: true, goalId: "g-1" }),
  adminToggleGoalAction: vi.fn().mockResolvedValue({ ok: true, goalId: "g-1" }),
}));

vi.mock("@/features/accountability/api/pardon.actions", () => ({
  pardonParticipantAction: vi.fn().mockResolvedValue({ ok: true }),
  revokePardonAction: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("AdminRosterGrid Component", () => {
  const mockChallenge = {
    id: "chal-1",
    title: "Finals Accountability",
    format: "TEAM_VS_TEAM",
    status: "ACTIVE",
    startAt: "2026-09-01T00:00:00.000Z",
    endAt: "2026-09-08T00:00:00.000Z",
  };

  const mockParticipants = [
    {
      id: "part-1",
      userId: "user-1",
      targetSeconds: 126000,
      status: "NORMAL",
      user: {
        id: "user-1",
        name: "Morgan Lee",
        displayName: "Morgan",
        username: "morganlee",
        image: null,
      },
      team: {
        id: "team-1",
        name: "Honey Bees",
        iconEmoji: "🐝",
      },
      dailyStudyLogs: [
        {
          id: "log-1",
          logDate: "2026-09-02",
          durationSeconds: 14400,
          isOverride: true,
          overrideReason: "Manual correction by host",
        },
      ],
      weeklyGoals: [
        {
          id: "goal-1",
          description: "Read Organic Chemistry Chapters 1-4",
          completed: true,
        },
        {
          id: "goal-2",
          description: "Complete Problem Set 3",
          completed: false,
        },
      ],
      punishmentRecord: null,
    },
  ];

  it("renders page header and navigation back link", () => {
    const html = renderToStaticMarkup(
      <AdminRosterGrid
        challenge={mockChallenge}
        participants={mockParticipants}
      />,
    );

    expect(html).toContain("Roster &amp; Hours Override Grid");
    expect(html).toContain("Back to Challenge Hub");
    expect(html).toContain("View Public Scoreboard");
  });

  it("renders participant row with user details, house team, logged/target hours, and goals", () => {
    const html = renderToStaticMarkup(
      <AdminRosterGrid
        challenge={mockChallenge}
        participants={mockParticipants}
      />,
    );

    expect(html).toContain("Morgan");
    expect(html).toContain("@morganlee");
    expect(html).toContain("Honey Bees");
    expect(html).toContain("04:00:00 / 35:00:00");
    expect(html).toContain("1 / 2 done");
    expect(html).toContain("★ host override applied");
  });

  it("renders action buttons: Override Hours, Goals, and Pardon", () => {
    const html = renderToStaticMarkup(
      <AdminRosterGrid
        challenge={mockChallenge}
        participants={mockParticipants}
      />,
    );

    expect(html).toContain("Override Hours");
    expect(html).toContain("Goals");
    expect(html).toContain("Pardon");
  });

  it("renders empty state message when no participants are enrolled", () => {
    const html = renderToStaticMarkup(
      <AdminRosterGrid
        challenge={mockChallenge}
        participants={[]}
      />,
    );

    expect(html).toContain("No participants enrolled");
    expect(html).toContain("Return to the challenge hub to assign members to house teams.");
  });
});
