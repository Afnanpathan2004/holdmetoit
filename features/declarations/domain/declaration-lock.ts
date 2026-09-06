export type ChallengeLifecycleStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";

/** FEAT-DECL-03: targets and goal descriptions lock when challenge is no longer UPCOMING. */
export function areDeclarationsLocked(status: ChallengeLifecycleStatus): boolean {
  return status !== "UPCOMING";
}

export function canEditDeclarations(status: ChallengeLifecycleStatus): boolean {
  return status === "UPCOMING";
}

export function canToggleGoalCompletion(status: ChallengeLifecycleStatus): boolean {
  return status === "ACTIVE";
}

export function canLogStudyTime(status: ChallengeLifecycleStatus): boolean {
  return status === "ACTIVE";
}

export function isChallengeReadOnly(status: ChallengeLifecycleStatus): boolean {
  return status === "COMPLETED";
}
