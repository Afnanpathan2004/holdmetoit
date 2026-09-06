export type ChallengeStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";

export class ChallengeStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChallengeStateError";
  }
}

/**
 * Validates if a challenge can transition from its current status to ACTIVE (Kickoff).
 */
export function canKickoffChallenge(status: ChallengeStatus): boolean {
  return status === "UPCOMING";
}

/**
 * Asserts that a challenge can be kicked off; throws ChallengeStateError otherwise.
 */
export function assertCanKickoffChallenge(status: ChallengeStatus): void {
  if (status === "ACTIVE") {
    throw new ChallengeStateError("Challenge is already active.");
  }
  if (status === "COMPLETED") {
    throw new ChallengeStateError("Cannot start a challenge that is already completed.");
  }
}

/**
 * Validates if a challenge can transition from its current status to COMPLETED (Lock Final Results).
 */
export function canLockChallenge(status: ChallengeStatus): boolean {
  return status === "ACTIVE";
}

/**
 * Asserts that a challenge can be locked; throws ChallengeStateError otherwise.
 */
export function assertCanLockChallenge(status: ChallengeStatus): void {
  if (status === "UPCOMING") {
    throw new ChallengeStateError(
      "Cannot lock final results on an event that has not started yet.",
    );
  }
  if (status === "COMPLETED") {
    throw new ChallengeStateError("Challenge results are already locked and finalized.");
  }
}

export interface ChallengeCreationInput {
  title: string;
  format: "TEAM_VS_TEAM" | "DUOS" | "SOLOS";
  startAt: Date | string;
  endAt: Date | string;
  punishmentPfpUrl?: string | null;
  teams: Array<{
    name: string;
    color?: string | null;
    iconEmoji?: string | null;
    mascotUrl?: string | null;
  }>;
}

/**
 * Validates challenge setup parameters for the challenge creator wizard (FEAT-CHAL-01).
 */
export function validateChallengeCreation(input: ChallengeCreationInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const title = input.title?.trim() ?? "";
  if (!title) {
    errors.title = "Challenge title is required.";
  } else if (title.length < 3) {
    errors.title = "Challenge title must be at least 3 characters.";
  } else if (title.length > 80) {
    errors.title = "Challenge title cannot exceed 80 characters.";
  }

  const start = new Date(input.startAt);
  const end = new Date(input.endAt);

  if (Number.isNaN(start.getTime())) {
    errors.startAt = "Start date is invalid.";
  }
  if (Number.isNaN(end.getTime())) {
    errors.endAt = "End date is invalid.";
  }
  if (!errors.startAt && !errors.endAt && end.getTime() <= start.getTime()) {
    errors.endAt = "End time must be after start time.";
  }

  if (!input.teams || input.teams.length === 0) {
    errors.teams = "At least one team/house roster must be configured.";
  } else {
    const trimmedNames = input.teams.map((t) => t.name?.trim() ?? "");
    if (trimmedNames.some((name) => !name)) {
      errors.teams = "All teams must have a non-empty name.";
    }
    const uniqueNames = new Set(trimmedNames.map((n) => n.toLowerCase()));
    if (uniqueNames.size !== trimmedNames.length) {
      errors.teams = "Team names must be unique within the challenge.";
    }

    if (input.format === "TEAM_VS_TEAM" && input.teams.length < 2) {
      errors.teams = "Team vs Team format requires at least 2 competing teams.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
