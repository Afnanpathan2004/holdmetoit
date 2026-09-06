import { describe, expect, it } from "vitest";

import { DurationRangeError } from "@/features/study-logs/domain/duration";
import {
  aggregateTeamScores,
  calculateLeadMargin,
} from "@/features/leaderboard/domain/leaderboard";

const teams = [
  { id: "bees" },
  { id: "butterflies" },
  { id: "solos-team-1" },
];

describe("aggregateTeamScores", () => {
  it("sums participant seconds per team and sorts descending", () => {
    const logs = [
      { teamId: "bees", loggedSeconds: 22_500 },
      { teamId: "bees", loggedSeconds: 18_000 },
      { teamId: "butterflies", loggedSeconds: 21_000 },
      { teamId: "butterflies", loggedSeconds: 19_335 },
    ];

    const result = aggregateTeamScores(teams.slice(0, 2), logs);

    expect(result).toEqual([
      { teamId: "bees", totalSeconds: 40_500 },
      { teamId: "butterflies", totalSeconds: 40_335 },
    ]);
  });

  it("returns zero totals for teams with no logs", () => {
    const result = aggregateTeamScores(teams, []);

    expect(result).toEqual([
      { teamId: "bees", totalSeconds: 0 },
      { teamId: "butterflies", totalSeconds: 0 },
      { teamId: "solos-team-1", totalSeconds: 0 },
    ]);
  });

  it("treats solo teams as standard team aggregates (Law L1)", () => {
    const soloTeams = [{ id: "solo-a" }, { id: "solo-b" }];
    const logs = [
      { teamId: "solo-a", loggedSeconds: 12_000 },
      { teamId: "solo-b", loggedSeconds: 9_500 },
    ];

    const result = aggregateTeamScores(soloTeams, logs);

    expect(result[0]).toEqual({ teamId: "solo-a", totalSeconds: 12_000 });
    expect(result[1]).toEqual({ teamId: "solo-b", totalSeconds: 9_500 });
  });

  it("includes orphan log team IDs not present in the teams array", () => {
    const result = aggregateTeamScores([{ id: "bees" }], [
      { teamId: "bees", loggedSeconds: 1_000 },
      { teamId: "orphan", loggedSeconds: 500 },
    ]);

    expect(result).toEqual([
      { teamId: "bees", totalSeconds: 1_000 },
      { teamId: "orphan", totalSeconds: 500 },
    ]);
  });

  it("rejects negative logged seconds", () => {
    expect(() =>
      aggregateTeamScores(teams, [{ teamId: "bees", loggedSeconds: -1 }]),
    ).toThrow(DurationRangeError);
  });
});

describe("calculateLeadMargin", () => {
  it("identifies team A as leader", () => {
    const result = calculateLeadMargin(198_000, 183_935);

    expect(result).toEqual({
      marginSeconds: 14_065,
      leader: "a",
      signedMarginSeconds: 14_065,
    });
  });

  it("identifies team B as leader", () => {
    const result = calculateLeadMargin(40_335, 40_500);

    expect(result).toEqual({
      marginSeconds: 165,
      leader: "b",
      signedMarginSeconds: -165,
    });
  });

  it("returns a tie when totals are equal", () => {
    const result = calculateLeadMargin(50_000, 50_000);

    expect(result).toEqual({
      marginSeconds: 0,
      leader: "tie",
      signedMarginSeconds: 0,
    });
  });

  it("handles zero-second totals", () => {
    expect(calculateLeadMargin(0, 0).leader).toBe("tie");
  });

  it("rejects negative totals", () => {
    expect(() => calculateLeadMargin(-1, 0)).toThrow(DurationRangeError);
    expect(() => calculateLeadMargin(0, -1)).toThrow(DurationRangeError);
  });
});
