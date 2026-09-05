import { DurationRangeError } from "@/features/study-logs/domain/duration";

export interface TeamRef {
  id: string;
}

export interface ParticipantLogEntry {
  teamId: string;
  loggedSeconds: number;
}

export interface TeamAggregateScore {
  teamId: string;
  totalSeconds: number;
}

export type LeadSide = "a" | "b" | "tie";

export interface LeadMarginResult {
  /** Absolute difference in seconds between the two teams. */
  marginSeconds: number;
  /** Which side leads, or `tie` when totals are equal. */
  leader: LeadSide;
  /** Signed margin from team A's perspective (positive = A leads). */
  signedMarginSeconds: number;
}

/**
 * Aggregates participant logged seconds by team (Law L1).
 * Every team in `teams` receives an entry; teams with no logs total 0.
 * Results are sorted descending by totalSeconds (standings order).
 */
export function aggregateTeamScores(
  teams: readonly TeamRef[],
  logs: readonly ParticipantLogEntry[],
): TeamAggregateScore[] {
  const totals = new Map<string, number>();

  for (const team of teams) {
    totals.set(team.id, 0);
  }

  for (const log of logs) {
    assertNonNegativeInteger("loggedSeconds", log.loggedSeconds);

    const current = totals.get(log.teamId) ?? 0;
    totals.set(log.teamId, current + log.loggedSeconds);
  }

  const aggregates: TeamAggregateScore[] = [];

  for (const team of teams) {
    aggregates.push({
      teamId: team.id,
      totalSeconds: totals.get(team.id) ?? 0,
    });
  }

  // Include scores for team IDs present only in logs (orphan assignments).
  for (const [teamId, totalSeconds] of Array.from(totals.entries())) {
    if (!aggregates.some((entry) => entry.teamId === teamId)) {
      aggregates.push({ teamId, totalSeconds });
    }
  }

  return aggregates.sort((a, b) => b.totalSeconds - a.totalSeconds);
}

/**
 * Calculates the lead margin between two team totals (FEAT-LEAD-01).
 */
export function calculateLeadMargin(
  teamASeconds: number,
  teamBSeconds: number,
): LeadMarginResult {
  assertNonNegativeInteger("teamASeconds", teamASeconds);
  assertNonNegativeInteger("teamBSeconds", teamBSeconds);

  const signedMarginSeconds = teamASeconds - teamBSeconds;
  const marginSeconds = Math.abs(signedMarginSeconds);

  if (marginSeconds === 0) {
    return {
      marginSeconds: 0,
      leader: "tie",
      signedMarginSeconds: 0,
    };
  }

  return {
    marginSeconds,
    leader: signedMarginSeconds > 0 ? "a" : "b",
    signedMarginSeconds,
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
