import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ChallengeAdminHub } from "./challenge-admin-hub";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/challenges/api/challenge-admin.actions", () => ({
  kickoffChallengeAction: vi.fn().mockResolvedValue({ ok: true }),
  finalizeChallengeAction: vi.fn().mockResolvedValue({ ok: true }),
  enrollParticipantAction: vi.fn().mockResolvedValue({ ok: true }),
  renameDuoTeamAction: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("ChallengeAdminHub Component", () => {
  const mockChallenge = {
    id: "chal-1",
    title: "Midterm Grindfest",
    format: "TEAM_VS_TEAM" as const,
    status: "UPCOMING" as const,
    startAt: "2026-09-10T00:00:00.000Z",
    endAt: "2026-09-17T00:00:00.000Z",
    punishmentPfpUrl: null,
    teams: [
      {
        id: "team-1",
        name: "Honey Bees",
        color: "#ebb06e",
        iconEmoji: "🐝",
        maxMembers: null,
        sortOrder: 0,
      },
      {
        id: "team-2",
        name: "Lavender Butterflies",
        color: "#9986b8",
        iconEmoji: "🦋",
        maxMembers: null,
        sortOrder: 1,
      },
    ],
    participants: [
      {
        id: "part-1",
        userId: "user-1",
        teamId: "team-1",
        targetSeconds: 126000,
        status: "NORMAL",
        createdAt: "2026-09-08T00:00:00.000Z",
        user: {
          id: "user-1",
          name: "Alex River",
          displayName: "Alex",
          username: "alex_study",
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
            durationSeconds: 18000,
            logDate: "2026-09-10",
            isOverride: false,
          },
        ],
        weeklyGoals: [
          {
            id: "goal-1",
            description: "Finish Calculus Chapter 3",
            completed: true,
          },
        ],
        punishmentRecord: null,
      },
    ],
  };

  const mockUsers = [
    {
      id: "user-2",
      name: "Sam Taylor",
      displayName: "Sam",
      username: "samtaylor",
      image: null,
    },
  ];

  const mockAuditLogs = [
    {
      id: "audit-1",
      timestamp: "2026-09-08T12:00:00.000Z",
      actorUsername: "host_admin",
      actionType: "CHALLENGE_CREATED",
      targetEntityType: "CHALLENGE",
      auditReason: "Created challenge for midterm prep.",
    },
  ];

  it("renders challenge header with title, format, and status badge", () => {
    const html = renderToStaticMarkup(
      <ChallengeAdminHub
        challenge={mockChallenge}
        allUsers={mockUsers}
        auditLogs={mockAuditLogs}
      />,
    );

    expect(html).toContain("Midterm Grindfest");
    expect(html).toContain("TEAM_VS_TEAM");
    expect(html).toContain("Status: UPCOMING");
  });

  it("renders Kickoff button when challenge status is UPCOMING", () => {
    const html = renderToStaticMarkup(
      <ChallengeAdminHub
        challenge={mockChallenge}
        allUsers={mockUsers}
        auditLogs={mockAuditLogs}
      />,
    );

    expect(html).toContain("Kickoff Challenge Now");
  });

  it("renders Lock Final Results button when challenge status is ACTIVE", () => {
    const activeChallenge = {
      ...mockChallenge,
      status: "ACTIVE" as const,
    };

    const html = renderToStaticMarkup(
      <ChallengeAdminHub
        challenge={activeChallenge}
        allUsers={mockUsers}
        auditLogs={mockAuditLogs}
      />,
    );

    expect(html).toContain("Lock Final Results (Evaluate Punishments)");
  });

  it("renders 1-Click Discord Summary button and preview toggle", () => {
    const html = renderToStaticMarkup(
      <ChallengeAdminHub
        challenge={mockChallenge}
        allUsers={mockUsers}
        auditLogs={mockAuditLogs}
      />,
    );

    expect(html).toContain("1-Click Discord Summary");
    expect(html).toContain("Preview Markdown");
  });

  it("renders participant enrollment panel with available users", () => {
    const html = renderToStaticMarkup(
      <ChallengeAdminHub
        challenge={mockChallenge}
        allUsers={mockUsers}
        auditLogs={mockAuditLogs}
      />,
    );

    expect(html).toContain("Enroll Participant");
    expect(html).toContain("Sam (@samtaylor)");
    expect(html).toContain("Honey Bees");
  });

  it("renders challenge audit trail section", () => {
    const html = renderToStaticMarkup(
      <ChallengeAdminHub
        challenge={mockChallenge}
        allUsers={mockUsers}
        auditLogs={mockAuditLogs}
      />,
    );

    expect(html).toContain("Challenge Audit Trail (FEAT-AUDIT-01)");
    expect(html).toContain("host_admin");
    expect(html).toContain("CHALLENGE_CREATED");
    expect(html).toContain("Created challenge for midterm prep.");
  });
});
