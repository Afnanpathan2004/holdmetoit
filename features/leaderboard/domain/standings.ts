import { DurationRangeError } from "@/features/study-logs/domain/duration";

export interface ParticipantStandingInput {
  id: string;
  totalLoggedSeconds: number;
  targetSeconds: number;
  enrolledAt: Date;
  completedGoalsCount: number;
  totalGoalsCount: number;
}

export interface RankedParticipant<T extends ParticipantStandingInput = ParticipantStandingInput> {
  item: T;
  rank: number;
  isPodium: 1 | 2 | 3 | null;
  progressPercent: number;
}

/**
 * Deterministically ranks participants for the scoreboard standings (FEAT-LEAD-02).
 *
 * Sorting priority:
 * 1. Total logged study seconds (descending)
 * 2. Target completion percentage (descending)
 * 3. Enrollment timestamp (ascending — earlier enrolled first)
 * 4. Participant ID (ascending — stable deterministic tie-breaker)
 *
 * Rank assignment uses standard competition ranking (1224).
 * If two participants have the exact same logged seconds, they share the same rank.
 */
export function rankParticipants<T extends ParticipantStandingInput>(
  participants: readonly T[],
): RankedParticipant<T>[] {
  for (const p of participants) {
    if (!Number.isInteger(p.totalLoggedSeconds) || p.totalLoggedSeconds < 0) {
      throw new DurationRangeError("totalLoggedSeconds must be a non-negative integer.");
    }
    if (!Number.isInteger(p.targetSeconds) || p.targetSeconds < 0) {
      throw new DurationRangeError("targetSeconds must be a non-negative integer.");
    }
  }

  const sorted = [...participants].sort((a, b) => {
    // 1. Logged seconds
    if (b.totalLoggedSeconds !== a.totalLoggedSeconds) {
      return b.totalLoggedSeconds - a.totalLoggedSeconds;
    }

    // 2. Completion ratio
    const aRatio = a.targetSeconds > 0 ? a.totalLoggedSeconds / a.targetSeconds : 0;
    const bRatio = b.targetSeconds > 0 ? b.totalLoggedSeconds / b.targetSeconds : 0;
    if (bRatio !== aRatio) {
      return bRatio - aRatio;
    }

    // 3. Earlier enrollment
    const aTime = a.enrolledAt.getTime();
    const bTime = b.enrolledAt.getTime();
    if (aTime !== bTime) {
      return aTime - bTime;
    }

    // 4. Stable string comparison
    return a.id.localeCompare(b.id);
  });

  const ranked: RankedParticipant<T>[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];

    if (i > 0) {
      const prev = sorted[i - 1];
      if (item.totalLoggedSeconds !== prev.totalLoggedSeconds) {
        currentRank = i + 1;
      }
    }

    const isPodium = currentRank === 1 ? 1 : currentRank === 2 ? 2 : currentRank === 3 ? 3 : null;

    const progressPercent =
      item.targetSeconds > 0
        ? Math.min(100, Math.round((item.totalLoggedSeconds / item.targetSeconds) * 100))
        : 0;

    ranked.push({
      item,
      rank: currentRank,
      isPodium,
      progressPercent,
    });
  }

  return ranked;
}

/**
 * Backward-compatible alias for ranking participants (calculateStandings = rankParticipants).
 */
export const calculateStandings = rankParticipants;
export type Standing<T extends ParticipantStandingInput = ParticipantStandingInput> = RankedParticipant<T>;

