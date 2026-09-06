import type { ChallengeFormat, ChallengeStatus } from "@prisma/client";

import { prisma } from "@/core/db";
import {
  evaluateParticipantPunishment,
  type PunishmentEvaluation,
} from "@/features/accountability/domain/punishment";
import {
  calculateInclusiveDaysRemaining,
  sumLoggedSeconds,
} from "@/features/leaderboard/domain/catch-up-presentation";
import {
  aggregateTeamScores,
  calculateLeadMargin,
} from "@/features/leaderboard/domain/leaderboard";
import { rankParticipants } from "@/features/leaderboard/domain/standings";

export interface ScoreboardTeam {
  id: string;
  name: string;
  color: string | null;
  iconEmoji: string | null;
  mascotUrl: string | null;
  sortOrder: number;
  totalSeconds: number;
  memberCount: number;
}

export interface ScoreboardGoal {
  id: string;
  description: string;
  completed: boolean;
}

export interface ScoreboardParticipant {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  teamId: string;
  teamName: string;
  teamColor: string | null;
  teamIconEmoji: string | null;
  totalLoggedSeconds: number;
  targetSeconds: number;
  progressPercent: number;
  rank: number;
  isPodium: 1 | 2 | 3 | null;
  completedGoalsCount: number;
  totalGoalsCount: number;
  goals: ScoreboardGoal[];
  statusBadge: {
    label: string;
    variant: "sage" | "terracotta" | "neutral";
  };
  punishmentEvaluation: PunishmentEvaluation;
  punishmentRecord: {
    id: string;
    isPunished: boolean;
    isPardoned: boolean;
    pardonReason: string | null;
  } | null;
}

export interface ScoreboardMatchLead {
  marginSeconds: number;
  leader: "a" | "b" | "tie";
  signedMarginSeconds: number;
  leadingTeam: ScoreboardTeam | null;
  trailingTeam: ScoreboardTeam | null;
  isTie: boolean;
}

export interface ScoreboardViewModel {
  challenge: {
    id: string;
    title: string;
    format: ChallengeFormat;
    status: ChallengeStatus;
    startAt: Date;
    endAt: Date;
    punishmentPfpUrl: string | null;
  };
  teams: ScoreboardTeam[];
  leadMargin: ScoreboardMatchLead | null;
  participants: ScoreboardParticipant[];
  punishedParticipants: ScoreboardParticipant[];
}

export interface RawGoalRecord {
  id: string;
  description: string;
  completed: boolean;
  sortOrder?: number;
}

export interface RawStudyLogRecord {
  durationSeconds: number;
}

export interface RawPunishmentRecord {
  id: string;
  isPunished: boolean;
  isPardoned: boolean;
  pardonReason: string | null;
}

export interface RawUserRecord {
  id: string;
  name: string | null;
  username: string | null;
  displayName: string | null;
  image: string | null;
}

export interface RawParticipantRecord {
  id: string;
  userId: string;
  teamId: string;
  targetSeconds: number;
  enrolledAt: Date;
  user?: RawUserRecord | null;
  dailyStudyLogs?: RawStudyLogRecord[];
  weeklyGoals?: RawGoalRecord[];
  punishmentRecord?: RawPunishmentRecord | null;
}

export interface RawTeamRecord {
  id: string;
  name: string;
  color: string | null;
  iconEmoji: string | null;
  mascotUrl: string | null;
  sortOrder: number;
}

export interface RawChallengePayload {
  id: string;
  title: string;
  format: ChallengeFormat;
  status: ChallengeStatus;
  startAt: Date;
  endAt: Date;
  punishmentPfpUrl: string | null;
  teams: RawTeamRecord[];
  participants: RawParticipantRecord[];
}

/**
 * Transforms raw challenge records into the ScoreboardViewModel using pure domain engines.
 * Zero manual arithmetic; relies on aggregateTeamScores, calculateLeadMargin,
 * rankParticipants, and evaluateParticipantPunishment.
 */
export function buildScoreboardViewModel(
  challenge: RawChallengePayload,
  now: Date = new Date(),
): ScoreboardViewModel {
  // 1. Team aggregations (Law L1 / FEAT-LEAD-01)
  const teamRefs = challenge.teams.map((t) => ({ id: t.id }));
  const participantLogs = challenge.participants.map((p) => ({
    teamId: p.teamId,
    loggedSeconds: sumLoggedSeconds(p.dailyStudyLogs ?? []),
  }));

  const teamScores = aggregateTeamScores(teamRefs, participantLogs);
  const teamScoresMap = new Map<string, number>(
    teamScores.map((ts) => [ts.teamId, ts.totalSeconds]),
  );

  const memberCountMap = new Map<string, number>();
  for (const p of challenge.participants) {
    memberCountMap.set(p.teamId, (memberCountMap.get(p.teamId) ?? 0) + 1);
  }

  const teams: ScoreboardTeam[] = challenge.teams.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    iconEmoji: t.iconEmoji,
    mascotUrl: t.mascotUrl,
    sortOrder: t.sortOrder,
    totalSeconds: teamScoresMap.get(t.id) ?? 0,
    memberCount: memberCountMap.get(t.id) ?? 0,
  }));

  // 2. Head-to-head match lead margin (FEAT-LEAD-01)
  let leadMargin: ScoreboardMatchLead | null = null;
  if (teams.length === 2) {
    const teamA = teams[0];
    const teamB = teams[1];
    const margin = calculateLeadMargin(teamA.totalSeconds, teamB.totalSeconds);
    const leadingTeam =
      margin.leader === "a" ? teamA : margin.leader === "b" ? teamB : null;
    const trailingTeam =
      margin.leader === "a" ? teamB : margin.leader === "b" ? teamA : null;
    leadMargin = {
      marginSeconds: margin.marginSeconds,
      leader: margin.leader,
      signedMarginSeconds: margin.signedMarginSeconds,
      leadingTeam,
      trailingTeam,
      isTie: margin.leader === "tie",
    };
  } else if (teams.length > 2) {
    const sorted = [...teams].sort((a, b) => b.totalSeconds - a.totalSeconds);
    const teamA = sorted[0];
    const teamB = sorted[1];
    const margin = calculateLeadMargin(teamA.totalSeconds, teamB.totalSeconds);
    const isTie = margin.leader === "tie";
    leadMargin = {
      marginSeconds: margin.marginSeconds,
      leader: margin.leader,
      signedMarginSeconds: margin.signedMarginSeconds,
      leadingTeam: isTie ? null : teamA,
      trailingTeam: isTie ? null : teamB,
      isTie,
    };
  }

  // 3. Deterministic participant rankings (FEAT-LEAD-02)
  const participantInputs = challenge.participants.map((p) => {
    const totalLoggedSeconds = sumLoggedSeconds(p.dailyStudyLogs ?? []);
    const goals = p.weeklyGoals ?? [];
    return {
      raw: p,
      id: p.id,
      totalLoggedSeconds,
      targetSeconds: p.targetSeconds,
      enrolledAt: p.enrolledAt,
      completedGoalsCount: goals.filter((g) => g.completed).length,
      totalGoalsCount: goals.length,
    };
  });

  const ranked = rankParticipants(participantInputs);
  const teamMap = new Map<string, RawTeamRecord>(
    challenge.teams.map((t) => [t.id, t]),
  );
  const daysRemaining = calculateInclusiveDaysRemaining(challenge.endAt, now);

  const participants: ScoreboardParticipant[] = ranked.map((r) => {
    const p = r.item.raw;
    const team = teamMap.get(p.teamId);
    const totalLoggedSeconds = r.item.totalLoggedSeconds;
    const targetSeconds = r.item.targetSeconds;
    const goals = (p.weeklyGoals ?? []).map((g) => ({
      id: g.id,
      description: g.description,
      completed: g.completed,
    }));
    const punishmentEvaluation = evaluateParticipantPunishment(
      targetSeconds,
      totalLoggedSeconds,
      goals,
    );

    let statusBadge: {
      label: string;
      variant: "sage" | "terracotta" | "neutral";
    };

    if (challenge.status === "COMPLETED") {
      if (p.punishmentRecord?.isPardoned) {
        statusBadge = { label: "Pardoned", variant: "neutral" };
      } else if (
        p.punishmentRecord?.isPunished ||
        punishmentEvaluation.isPunished
      ) {
        statusBadge = { label: "Forfeit", variant: "terracotta" };
      } else {
        statusBadge = { label: "Completed", variant: "sage" };
      }
    } else if (challenge.status === "UPCOMING") {
      statusBadge = { label: "Enrolled", variant: "neutral" };
    } else {
      // ACTIVE
      if (targetSeconds > 0 && totalLoggedSeconds >= targetSeconds) {
        statusBadge = { label: "Target Met", variant: "sage" };
      } else if (targetSeconds === 0) {
        statusBadge = { label: "Active", variant: "neutral" };
      } else {
        const remainingDeficit = Math.max(0, targetSeconds - totalLoggedSeconds);
        const pacePerDay =
          daysRemaining > 0
            ? remainingDeficit / daysRemaining
            : remainingDeficit;

        if (daysRemaining <= 1 || pacePerDay > 28_800) {
          statusBadge = { label: "At Risk", variant: "terracotta" };
        } else {
          statusBadge = { label: "On Track", variant: "sage" };
        }
      }
    }

    return {
      id: p.id,
      userId: p.userId,
      username: p.user?.username ?? p.user?.name ?? "Anonymous",
      displayName:
        p.user?.displayName ??
        p.user?.name ??
        p.user?.username ??
        "Participant",
      avatarUrl: p.user?.image ?? null,
      teamId: p.teamId,
      teamName: team?.name ?? "Unknown Team",
      teamColor: team?.color ?? null,
      teamIconEmoji: team?.iconEmoji ?? null,
      totalLoggedSeconds,
      targetSeconds,
      progressPercent: r.progressPercent,
      rank: r.rank,
      isPodium: r.isPodium,
      completedGoalsCount: r.item.completedGoalsCount,
      totalGoalsCount: r.item.totalGoalsCount,
      goals,
      statusBadge,
      punishmentEvaluation,
      punishmentRecord: p.punishmentRecord
        ? {
            id: p.punishmentRecord.id,
            isPunished: p.punishmentRecord.isPunished,
            isPardoned: p.punishmentRecord.isPardoned,
            pardonReason: p.punishmentRecord.pardonReason,
          }
        : null,
    };
  });

  // 4. Punished participants for Punishment Nook (Law L6 / FEAT-PUN-02)
  // Only rendered when challenge is COMPLETED
  const punishedParticipants =
    challenge.status === "COMPLETED"
      ? participants.filter((p) => {
          const isFlagged =
            p.punishmentRecord?.isPunished ?? p.punishmentEvaluation.isPunished;
          const isPardoned = p.punishmentRecord?.isPardoned ?? false;
          return isFlagged && !isPardoned;
        })
      : [];

  return {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      format: challenge.format,
      status: challenge.status,
      startAt: challenge.startAt,
      endAt: challenge.endAt,
      punishmentPfpUrl: challenge.punishmentPfpUrl,
    },
    teams,
    leadMargin,
    participants,
    punishedParticipants,
  };
}

/**
 * Fetches challenge and all related records from DB and formats into ScoreboardViewModel.
 * Returns null if challenge does not exist.
 */
export async function getScoreboardData(
  challengeId: string,
  now: Date = new Date(),
): Promise<ScoreboardViewModel | null> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      teams: {
        orderBy: { sortOrder: "asc" },
      },
      participants: {
        include: {
          user: true,
          team: true,
          dailyStudyLogs: true,
          weeklyGoals: {
            orderBy: { sortOrder: "asc" },
          },
          punishmentRecord: true,
        },
      },
    },
  });

  if (!challenge) {
    return null;
  }

  return buildScoreboardViewModel(challenge, now);
}

