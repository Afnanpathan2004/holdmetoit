import {
  MAX_WEEKLY_TARGET_SECONDS,
  MIN_WEEKLY_TARGET_SECONDS,
} from "@/features/study-logs/domain/duration";

import type { ValidationResult } from "@/features/study-logs/domain/daily-log.validation";

const MIN_GOALS = 1;
const MAX_GOALS = 10;
const MAX_GOAL_DESCRIPTION_LENGTH = 500;

export function validateWeeklyTargetSeconds(
  targetSeconds: number,
): ValidationResult {
  if (!Number.isInteger(targetSeconds)) {
    return {
      ok: false,
      code: "INVALID_TARGET",
      message: "Weekly target must be a whole number of seconds.",
    };
  }

  if (targetSeconds < MIN_WEEKLY_TARGET_SECONDS) {
    return {
      ok: false,
      code: "TARGET_TOO_LOW",
      message: "Weekly target must be at least 1 hour.",
    };
  }

  if (targetSeconds > MAX_WEEKLY_TARGET_SECONDS) {
    return {
      ok: false,
      code: "TARGET_TOO_HIGH",
      message: "Weekly target cannot exceed 105 hours.",
    };
  }

  return { ok: true };
}

export function validateWeeklyGoalDescriptions(
  descriptions: string[],
): ValidationResult {
  const trimmed = descriptions.map((description) => description.trim());

  if (trimmed.length < MIN_GOALS || trimmed.length > MAX_GOALS) {
    return {
      ok: false,
      code: "INVALID_GOAL_COUNT",
      message: "You must declare between 1 and 10 weekly goals.",
    };
  }

  if (trimmed.some((description) => description.length === 0)) {
    return {
      ok: false,
      code: "EMPTY_GOAL",
      message: "Weekly goals cannot be empty.",
    };
  }

  if (
    trimmed.some((description) => description.length > MAX_GOAL_DESCRIPTION_LENGTH)
  ) {
    return {
      ok: false,
      code: "GOAL_TOO_LONG",
      message: `Each goal must be at most ${MAX_GOAL_DESCRIPTION_LENGTH} characters.`,
    };
  }

  return { ok: true };
}

export { MIN_GOALS, MAX_GOALS };
