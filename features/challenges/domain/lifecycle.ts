export type ChallengeStatusType = "UPCOMING" | "ACTIVE" | "COMPLETED";

export class InvalidLifecycleTransitionError extends Error {
  readonly fromStatus: ChallengeStatusType;
  readonly toStatus: ChallengeStatusType;

  constructor(fromStatus: ChallengeStatusType, toStatus: ChallengeStatusType, message?: string) {
    super(
      message ??
        `Cannot transition challenge from status "${fromStatus}" to "${toStatus}".`,
    );
    this.name = "InvalidLifecycleTransitionError";
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}

export class LifecyclePrerequisiteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LifecyclePrerequisiteError";
  }
}

/**
 * Validates if a challenge can be manually kicked off (FEAT-CHAL-02).
 * Only UPCOMING challenges can transition to ACTIVE.
 */
export function canStartChallenge(status: ChallengeStatusType): boolean {
  return status === "UPCOMING";
}

/**
 * Validates if a challenge can be finalized/locked (FEAT-CHAL-05).
 * Only ACTIVE challenges can transition to COMPLETED.
 */
export function canCompleteChallenge(status: ChallengeStatusType): boolean {
  return status === "ACTIVE";
}

/**
 * Enforces the strict unidirectional lifecycle state machine:
 * UPCOMING -> ACTIVE -> COMPLETED
 */
export function assertChallengeTransition(
  fromStatus: ChallengeStatusType,
  toStatus: ChallengeStatusType,
): void {
  if (fromStatus === toStatus) {
    throw new InvalidLifecycleTransitionError(
      fromStatus,
      toStatus,
      `Challenge is already in status "${fromStatus}".`,
    );
  }

  if (fromStatus === "UPCOMING" && toStatus === "ACTIVE") {
    return;
  }

  if (fromStatus === "ACTIVE" && toStatus === "COMPLETED") {
    return;
  }

  throw new InvalidLifecycleTransitionError(
    fromStatus,
    toStatus,
    `Illegal lifecycle transition: "${fromStatus}" -> "${toStatus}". Allowed transitions are UPCOMING -> ACTIVE and ACTIVE -> COMPLETED.`,
  );
}

export interface KickoffPrerequisites {
  teamsCount: number;
  participantsCount: number;
}

/**
 * Validates that a challenge has minimal structural integrity to kickoff.
 */
export function assertKickoffPrerequisites(prereqs: KickoffPrerequisites): void {
  if (prereqs.teamsCount <= 0) {
    throw new LifecyclePrerequisiteError(
      "Cannot start challenge: at least one team must be configured.",
    );
  }

  if (prereqs.participantsCount <= 0) {
    throw new LifecyclePrerequisiteError(
      "Cannot start challenge: at least one participant must be enrolled.",
    );
  }
}

