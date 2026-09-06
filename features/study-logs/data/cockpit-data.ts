import { findParticipantForUser } from "@/features/challenges/data/participant.repository";
import {
  buildCatchUpSummary,
  calculateInclusiveDaysRemaining,
  sumLoggedSeconds,
} from "@/features/leaderboard/domain/catch-up-presentation";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";
import {
  canEditDeclarations,
  canLogStudyTime,
  canToggleGoalCompletion,
  isChallengeReadOnly,
} from "@/features/declarations/domain/declaration-lock";

export interface CockpitGoal {
  id: string;
  description: string;
  completed: boolean;
  sortOrder: number;
}

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
  teamName: string;
  teamIcon: string | null;
  participant: ParticipantIdentity;
  targetSeconds: number;
  targetClock: string;
  totalLoggedSeconds: number;
  totalLoggedClock: string;
  canEditDeclarations: boolean;
  canLogStudyTime: boolean;
  canToggleGoals: boolean;
  isReadOnly: boolean;
  goals: CockpitGoal[];
  logs: CockpitLogDay[];
  catchUp: ReturnType<typeof buildCatchUpSummary>;
  todayDate: string;
  todayLoggedSeconds: number;
  todayLoggedClock: string;
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
  const totalLoggedSeconds = sumLoggedSeconds(participant.dailyStudyLogs);
  const todayLog = participant.dailyStudyLogs.find(
    (log) => formatUtcDateKey(log.logDate) === todayDate,
  );
  const todayLoggedSeconds = todayLog?.durationSeconds ?? 0;
  const remainingDailyAllowanceSeconds = Math.max(
    0,
    86_400 - todayLoggedSeconds,
  );

  const daysRemaining = calculateInclusiveDaysRemaining(
    participant.challenge.endAt,
    now,
  );

  return {
    challengeId: participant.challengeId,
    challengeTitle: participant.challenge.title,
    challengeStatus: participant.challenge.status,
    teamName: participant.team.name,
    teamIcon: participant.team.iconEmoji,
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
    canEditDeclarations: canEditDeclarations(participant.challenge.status),
    canLogStudyTime: canLogStudyTime(participant.challenge.status),
    canToggleGoals: canToggleGoalCompletion(participant.challenge.status),
    isReadOnly: isChallengeReadOnly(participant.challenge.status),
    goals: participant.weeklyGoals.map((goal) => ({
      id: goal.id,
      description: goal.description,
      completed: goal.completed,
      sortOrder: goal.sortOrder,
    })),
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
    remainingDailyAllowanceSeconds,
  };
}
