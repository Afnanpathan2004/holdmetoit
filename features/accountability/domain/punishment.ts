import { DurationRangeError } from "@/features/study-logs/domain/duration";

export interface WeeklyGoalStatus {
  completed: boolean;
}

export type PunishmentReason = "hours_deficit" | "incomplete_goals";

export interface PunishmentEvaluation {
  isPunished: boolean;
  reasons: PunishmentReason[];
  incompleteGoals: number;
  hoursDeficitSeconds: number;
}

/**
 * Dual-failure accountability evaluation (Law L6 / FEAT-PUN-01):
 * isPunished = (loggedSeconds < targetSeconds) OR (incompleteGoals > 0)
 */
export function evaluateParticipantPunishment(
  targetSeconds: number,
  loggedSeconds: number,
  goalsList: readonly WeeklyGoalStatus[],
): PunishmentEvaluation {
  assertNonNegativeInteger("targetSeconds", targetSeconds);
  assertNonNegativeInteger("loggedSeconds", loggedSeconds);

  const incompleteGoals = goalsList.filter((goal) => !goal.completed).length;
  const hoursDeficitSeconds = Math.max(0, targetSeconds - loggedSeconds);
  const reasons: PunishmentReason[] = [];

  if (loggedSeconds < targetSeconds) {
    reasons.push("hours_deficit");
  }

  if (incompleteGoals > 0) {
    reasons.push("incomplete_goals");
  }

  return {
    isPunished: reasons.length > 0,
    reasons,
    incompleteGoals,
    hoursDeficitSeconds,
  };
}

function assertNonNegativeInteger(label: string, value: number): void {
  if (!Number.isInteger(value)) {
    throw new DurationRangeError(`${label} must be an integer.`);
  }

  if (value < 0) {
    throw new DurationRangeError(`${label} cannot be negative.`);
  }
}
