import { describe, expect, it } from "vitest";

import {
  validateWeeklyGoalDescriptions,
  validateWeeklyTargetSeconds,
} from "@/features/declarations/domain/weekly-goals.validation";
import {
  MAX_WEEKLY_TARGET_SECONDS,
  MIN_WEEKLY_TARGET_SECONDS,
} from "@/features/study-logs/domain/duration";

describe("validateWeeklyTargetSeconds", () => {
  it("accepts targets between 1h and 105h", () => {
    expect(validateWeeklyTargetSeconds(MIN_WEEKLY_TARGET_SECONDS)).toEqual({
      ok: true,
    });
    expect(validateWeeklyTargetSeconds(MAX_WEEKLY_TARGET_SECONDS)).toEqual({
      ok: true,
    });
  });

  it("rejects targets below 1 hour", () => {
    const result = validateWeeklyTargetSeconds(MIN_WEEKLY_TARGET_SECONDS - 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("TARGET_TOO_LOW");
    }
  });

  it("rejects targets above 105 hours", () => {
    const result = validateWeeklyTargetSeconds(MAX_WEEKLY_TARGET_SECONDS + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("TARGET_TOO_HIGH");
    }
  });
});

describe("validateWeeklyGoalDescriptions", () => {
  it("accepts between 1 and 10 non-empty goals", () => {
    expect(
      validateWeeklyGoalDescriptions(["Finish chapter 1"]),
    ).toEqual({ ok: true });
    expect(
      validateWeeklyGoalDescriptions(
        Array.from({ length: 10 }, (_, index) => `Goal ${index + 1}`),
      ),
    ).toEqual({ ok: true });
  });

  it("rejects empty goal lists", () => {
    const result = validateWeeklyGoalDescriptions([]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_GOAL_COUNT");
    }
  });

  it("rejects more than 10 goals", () => {
    const result = validateWeeklyGoalDescriptions(
      Array.from({ length: 11 }, (_, index) => `Goal ${index + 1}`),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_GOAL_COUNT");
    }
  });

  it("rejects blank goal descriptions", () => {
    const result = validateWeeklyGoalDescriptions(["Valid goal", "   "]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("EMPTY_GOAL");
    }
  });
});
