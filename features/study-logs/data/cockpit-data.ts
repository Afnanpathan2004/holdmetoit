import { findParticipantForUser } from "@/features/challenges/data/participant.repository";
import {
  calculateChallengeStatus,
  canEditDeclarations,
  canLogStudyTime,
  isChallengeReadOnly,
} from "@/features/challenges/domain/challenge-lifecycle";
import {
  buildCatchUpSummary,
  calculateInclusiveDaysRemaining,
  sumLoggedSeconds,
} from "@/features/leaderboard/domain/catch-up-presentation";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";
import { getChallengeScoreboard } from "@/features/leaderboard/data/leaderboard-data";
import { getUserCategorizedTasks } from "@/features/tasks/data/task.repository";
import type { UserCategorizedTasks } from "@/features/tasks/domain/task.types";

export interface CockpitLogDay {
  logDate: string;
  durationSeconds: number;
  durationClock: string;
}

export interface ParticipantIdentity {
  id: string;
  userId: string;
  displayName: string | null;
  username: string | null;
  image: string | null;
}

export interface CockpitViewModel {
  challengeId: string;
  challengeTitle: string;
  challengeStatus: "UPCOMING" | "ACTIVE" | "COMPLETED";
  challengeFormat: "TEAM_VS_TEAM" | "DUOS" | "SOLOS";
  teamName: string;
  teamIcon: string | null;
  participant: ParticipantIdentity;
  targetSeconds: number;
  targetClock: string;
  totalLoggedSeconds: number;
  totalLoggedClock: string;
  canEditDeclarations: boolean;
  canLogStudyTime: boolean;
  isReadOnly: boolean;
  userTasks?: UserCategorizedTasks;
  logs: CockpitLogDay[];
  catchUp: ReturnType<typeof buildCatchUpSummary>;
  todayDate: string;
  todayLoggedSeconds: number;
  todayLoggedClock: string;
  yesterdayDate: string;
  yesterdayLoggedSeconds: number;
  isYesterdayMissed: boolean;
  teamRank: number | null;
  remainingDailyAllowanceSeconds: number;
}

function formatUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getParticipantCockpit(
  userId: string,
  challengeId?: string,
): Promise<CockpitViewModel | null> {
  const participant = await findParticipantForUser(userId, challengeId);

  if (!participant) {
    return null;
  }

  const now = new Date();
  const todayDate = formatUtcDateKey(now);
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayDate = formatUtcDateKey(yesterday);

  const totalLoggedSeconds = sumLoggedSeconds(participant.dailyStudyLogs);
  const todayLog = participant.dailyStudyLogs.find(
    (log) => formatUtcDateKey(log.logDate) === todayDate,
  );
  const todayLoggedSeconds = todayLog?.durationSeconds ?? 0;
  const remainingDailyAllowanceSeconds = Math.max(
    0,
    86_400 - todayLoggedSeconds,
  );

  const yesterdayLog = participant.dailyStudyLogs.find(
    (log) => formatUtcDateKey(log.logDate) === yesterdayDate,
  );
  const yesterdayLoggedSeconds = yesterdayLog?.durationSeconds ?? 0;

  const challengeStatus = calculateChallengeStatus(participant.challenge, now);
  const challengeStartDate = formatUtcDateKey(participant.challenge.startAt);
  const isYesterdayMissed =
    challengeStatus === "ACTIVE" &&
    yesterdayDate >= challengeStartDate &&
    yesterdayLog === undefined;

  let teamRank: number | null = null;
  if (challengeStatus === "COMPLETED") {
    try {
      const scoreboard = await getChallengeScoreboard(participant.challengeId, userId);
      if (participant.challenge.format === "SOLOS") {
        const userStanding = scoreboard?.standings.find((s) => s.participantId === participant.id);
        teamRank = userStanding?.rank ?? 1;
      } else {
        if (scoreboard?.teams && participant.teamId) {
          const idx = scoreboard.teams.findIndex((t) => t.id === participant.teamId);
          teamRank = idx >= 0 ? idx + 1 : 1;
        } else {
          teamRank = 1;
        }
      }
    } catch {
      teamRank = 1;
    }
  }

  const daysRemaining = calculateInclusiveDaysRemaining(
    participant.challenge.endAt,
    now,
  );

  const userTasks = await getUserCategorizedTasks(userId);

  return {
    challengeId: participant.challengeId,
    challengeTitle: participant.challenge.title,
    challengeStatus,
    challengeFormat: participant.challenge.format,
    teamName: participant.team?.name ?? "Unassigned",
    teamIcon: participant.team?.iconEmoji ?? "⏳",
    participant: {
      id: participant.id,
      userId: participant.userId,
      displayName: participant.user.displayName ?? participant.user.name,
      username: participant.user.username,
      image: participant.user.image,
    },
    targetSeconds: participant.targetSeconds,
    targetClock: formatSecondsToClock(participant.targetSeconds),
    totalLoggedSeconds,
    totalLoggedClock: formatSecondsToClock(totalLoggedSeconds),
    canEditDeclarations: canEditDeclarations(challengeStatus),
    canLogStudyTime: canLogStudyTime(challengeStatus),
    isReadOnly: isChallengeReadOnly(challengeStatus),
    userTasks,
    logs: participant.dailyStudyLogs.map((log) => ({
      logDate: formatUtcDateKey(log.logDate),
      durationSeconds: log.durationSeconds,
      durationClock: formatSecondsToClock(log.durationSeconds),
    })),
    catchUp: buildCatchUpSummary({
      targetSeconds: participant.targetSeconds,
      totalLoggedSeconds,
      daysRemaining,
    }),
    todayDate,
    todayLoggedSeconds,
    todayLoggedClock: formatSecondsToClock(todayLoggedSeconds),
    yesterdayDate,
    yesterdayLoggedSeconds,
    isYesterdayMissed,
    teamRank,
    remainingDailyAllowanceSeconds,
  };
}
