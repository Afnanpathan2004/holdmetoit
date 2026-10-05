import { describe, expect, it } from "vitest";

import { DurationRangeError } from "@/features/study-logs/domain/duration";
import { evaluateParticipantPunishment } from "@/features/accountability/domain/punishment";

const completedGoals = [
  { completed: true },
  { completed: true },
  { completed: true },
];

describe("evaluateParticipantPunishment", () => {
  it("does not punish when hours and goals are fully met", () => {
    const result = evaluateParticipantPunishment(126_000, 126_000, completedGoals);

    expect(result).toEqual({
      isPunished: false,
      reasons: [],
      incompleteGoals: 0,
      hoursDeficitSeconds: 0,
    });
  });

  it("punishes when logged hours are below target even if goals are complete", () => {
    const result = evaluateParticipantPunishment(126_000, 100_000, completedGoals);

    expect(result.isPunished).toBe(true);
    expect(result.reasons).toEqual(["hours_deficit"]);
    expect(result.hoursDeficitSeconds).toBe(26_000);
    expect(result.incompleteGoals).toBe(0);
  });

  it("punishes when goals are incomplete even if hours meet target", () => {
    const goals = [{ completed: true }, { completed: false }];
    const result = evaluateParticipantPunishment(126_000, 126_000, goals);

    expect(result.isPunished).toBe(true);
    expect(result.reasons).toEqual(["incomplete_goals"]);
    expect(result.incompleteGoals).toBe(1);
    expect(result.hoursDeficitSeconds).toBe(0);
  });

  it("punishes with both reasons on dual failure", () => {
    const goals = [{ completed: false }, { completed: true }];
    const result = evaluateParticipantPunishment(126_000, 90_000, goals);

    expect(result.isPunished).toBe(true);
    expect(result.reasons).toEqual(["hours_deficit", "incomplete_goals"]);
    expect(result.incompleteGoals).toBe(1);
    expect(result.hoursDeficitSeconds).toBe(36_000);
  });

  it("does not punish when hours exceed target and all goals are complete", () => {
    const result = evaluateParticipantPunishment(126_000, 140_000, completedGoals);

    expect(result.isPunished).toBe(false);
    expect(result.reasons).toEqual([]);
  });

  it("punishes when no goals are completed", () => {
    const goals = [{ completed: false }, { completed: false }];
    const result = evaluateParticipantPunishment(10_000, 10_000, goals);

    expect(result.isPunished).toBe(true);
    expect(result.reasons).toEqual(["incomplete_goals"]);
    expect(result.incompleteGoals).toBe(2);
  });

  it("handles empty goal list as success for goals criterion", () => {
    const result = evaluateParticipantPunishment(10_000, 10_000, []);

    expect(result.isPunished).toBe(false);
    expect(result.incompleteGoals).toBe(0);
  });

  it("rejects negative duration inputs", () => {
    expect(() =>
      evaluateParticipantPunishment(-1, 0, completedGoals),
    ).toThrow(DurationRangeError);
    expect(() =>
      evaluateParticipantPunishment(100, -1, completedGoals),
    ).toThrow(DurationRangeError);
  });
});
