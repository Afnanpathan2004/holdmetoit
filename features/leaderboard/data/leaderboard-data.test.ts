import { describe, expect, it } from "vitest";

import {
  buildScoreboardViewModel,
  type RawChallengePayload,
} from "./leaderboard-data";

describe("buildScoreboardViewModel", () => {
  const mockChallenge: RawChallengePayload = {
    id: "test-challenge-1",
    title: "Midterm Reading Week Sprint",
    format: "TEAM_VS_TEAM",
    status: "ACTIVE",
    startAt: new Date("2026-09-01T00:00:00.000Z"),
    endAt: new Date("2026-09-08T00:00:00.000Z"),
    punishmentPfpUrl: "/assets/punishment_pfp.jpg",
    teams: [
      {
        id: "team-bees",
        name: "Honey Bees",
        color: "#d9822b",
        iconEmoji: "🐝",
        mascotUrl: "/assets/mascot_bees.jpg",
        sortOrder: 0,
      },
      {
        id: "team-butterflies",
        name: "Lavender Butterflies",
        color: "#9986b8",
        iconEmoji: "🦋",
        mascotUrl: "/assets/mascot_butterflies.jpg",
        sortOrder: 1,
      },
    ],
    participants: [
      {
        id: "part-1",
        userId: "user-1",
        teamId: "team-bees",
        targetSeconds: 126_000, // 35h
        status: "NORMAL",
        user: {
          id: "user-1",
          displayName: "AuraStudier",
          username: "aura",
          name: null,
          image: null,
        },
        dailyStudyLogs: [
          { durationSeconds: 16_200 }, // 4h30m
          { durationSeconds: 18_900 }, // 5h15m
        ],
        weeklyGoals: [
          { id: "g1", description: "Read Ch 1-3", completed: true },
          { id: "g2", description: "Past paper 1", completed: true },
        ],
      },
      {
        id: "part-2",
        userId: "user-2",
        teamId: "team-butterflies",
        targetSeconds: 126_000, // 35h
        status: "NORMAL",
        user: {
          id: "user-2",
          displayName: "SlothBrain",
          username: "sloth",
          name: null,
          image: null,
        },
        dailyStudyLogs: [
          { durationSeconds: 7_200 }, // 2h
        ],
        weeklyGoals: [
          { id: "g3", description: "Chemistry problem set", completed: false },
          { id: "g4", description: "Bio notes", completed: false },
        ],
      },
    ],
  };

  const fixedNow = new Date("2026-09-04T12:00:00.000Z");

  it("correctly aggregates team scores and calculates lead margin", () => {
    const result = buildScoreboardViewModel(mockChallenge, "user-1", fixedNow);

    // Bees: 16200 + 18900 = 35100s
    // Butterflies: 7200s
    expect(result.teams).toHaveLength(2);
    const bees = result.teams.find((t) => t.id === "team-bees");
    const butterflies = result.teams.find((t) => t.id === "team-butterflies");

    expect(bees?.totalLoggedSeconds).toBe(35_100);
    expect(bees?.isLeader).toBe(true);
    expect(butterflies?.totalLoggedSeconds).toBe(7_200);
    expect(butterflies?.isLeader).toBe(false);

    // Match banner
    expect(result.matchHeader.hasMatchup).toBe(true);
    expect(result.matchHeader.leaderSide).toBe("a");
    expect(result.matchHeader.leadMarginSeconds).toBe(27_900); // 35100 - 7200 = 27900
    expect(result.matchHeader.leaderTeamId).toBe("team-bees");
  });

  it("sorts participant standings descending by logged seconds", () => {
    const result = buildScoreboardViewModel(mockChallenge, "user-1", fixedNow);

    expect(result.standings).toHaveLength(2);
    expect(result.standings[0].displayName).toBe("AuraStudier");
    expect(result.standings[0].rank).toBe(1);
    expect(result.standings[1].displayName).toBe("SlothBrain");
    expect(result.standings[1].rank).toBe(2);
  });

  it("flags members with hours deficit or incomplete goals in punishment wall", () => {
    const result = buildScoreboardViewModel(mockChallenge, "user-1", fixedNow);

    // SlothBrain has 7200s < 126000s and 2 incomplete goals
    expect(result.punishmentWall.flaggedMembers).toHaveLength(2);
    // AuraStudier also hasn't met 35h yet (has 35100s) during ACTIVE sprint
    const sloth = result.punishmentWall.flaggedMembers.find((m) => m.displayName === "SlothBrain");
    expect(sloth).toBeDefined();
    expect(sloth?.incompleteGoalsCount).toBe(2);
    expect(sloth?.hoursDeficitSeconds).toBe(118_800);
  });

  it("marks completed challenge punishments accurately according to Law L6", () => {
    const completedChallenge: RawChallengePayload = {
      ...mockChallenge,
      status: "COMPLETED",
      participants: [
        {
          ...mockChallenge.participants[0],
          // Met target 35h: 126000s, all goals completed
          dailyStudyLogs: [{ durationSeconds: 126_000 }],
        },
        {
          ...mockChallenge.participants[1],
          // Target 35h: only 7200s, goals incomplete
          dailyStudyLogs: [{ durationSeconds: 7_200 }],
        },
      ],
    };

    const result = buildScoreboardViewModel(completedChallenge, undefined, fixedNow);

    expect(result.standings[0].paceStatus).toBe("serene");
    expect(result.standings[0].paceLabel).toBe("Completed");

    expect(result.standings[1].paceStatus).toBe("punished");
    expect(result.standings[1].paceLabel).toBe("Punished");

    // Only SlothBrain should be flagged on the punishment wall for a COMPLETED event
    expect(result.punishmentWall.flaggedMembers).toHaveLength(1);
    expect(result.punishmentWall.flaggedMembers[0].displayName).toBe("SlothBrain");
    expect(result.punishmentWall.flaggedMembers[0].statusBadge).toBe("Punished");
  });

  it("handles empty participants gracefully", () => {
    const emptyChallenge: RawChallengePayload = {
      ...mockChallenge,
      participants: [],
    };

    const result = buildScoreboardViewModel(emptyChallenge, undefined, fixedNow);

    expect(result.standings).toEqual([]);
    expect(result.punishmentWall.flaggedMembers).toEqual([]);
    expect(result.matchHeader.leadMarginSeconds).toBe(0);
    expect(result.teams[0].totalLoggedSeconds).toBe(0);
  });
});
