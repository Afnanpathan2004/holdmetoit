import { prisma } from "@/core/db";
import {
  evaluateParticipantPunishment,
  type WeeklyGoalStatus,
} from "@/features/accountability/domain/punishment";
import {
  calculateInclusiveDaysRemaining,
  sumLoggedSeconds,
} from "@/features/leaderboard/domain/catch-up-presentation";
import {
  aggregateTeamScores,
  calculateLeadMargin,
  type TeamRef,
} from "@/features/leaderboard/domain/leaderboard";
import {
  formatSecondsToClock,
  formatSecondsToHuman,
} from "@/features/study-logs/domain/duration";

export interface ScoreboardTeam {
  id: string;
  name: string;
  color: string | null;
  iconEmoji: string | null;
  mascotUrl: string | null;
  sortOrder: number;
  companionCount: number;
  totalLoggedSeconds: number;
  totalLoggedClock: string;
  isLeader: boolean;
}

export interface ScoreboardMatchHeader {
  hasMatchup: boolean;
  teamA: ScoreboardTeam | null;
  teamB: ScoreboardTeam | null;
  leadMarginSeconds: number;
  leadMarginClock: string;
  leadMarginHuman: string;
  leaderTeamId: string | null;
  leaderSide: "a" | "b" | "tie";
  ratioPercentageA: number;
  ratioPercentageB: number;
}

export type ParticipantPaceStatus =
  | "serene"
  | "on-track"
  | "catch-up"
  | "punished"
  | "excused";

export interface ScoreboardStandingEntry {
  rank: number;
  participantId: string;
  userId: string;
  displayName: string;
  username: string | null;
  image: string | null;
  teamId: string;
  teamName: string;
  teamColor: string | null;
  teamIcon: string | null;
  totalLoggedSeconds: number;
  totalLoggedClock: string;
  targetSeconds: number;
  targetClock: string;
  completionPercentage: number;
  goalsCompletedCount: number;
  goalsTotalCount: number;
  paceStatus: ParticipantPaceStatus;
  paceLabel: string;
  deficitSeconds: number;
}

export interface FlaggedPunishmentMember {
  participantId: string;
  userId: string;
  displayName: string;
  username: string | null;
  image: string | null;
  teamName: string;
  teamIcon: string | null;
  hoursDeficitSeconds: number;
  hoursDeficitClock: string;
  incompleteGoalsCount: number;
  isPardoned: boolean;
  pardonReason: string | null;
  statusBadge: "Catch-Up" | "Punished" | "Excused";
}

export interface PunishmentWallData {
  punishmentPfpUrl: string;
  flaggedMembers: FlaggedPunishmentMember[];
  isEventCompleted: boolean;
}

export interface ChallengeScoreboardViewModel {
  id: string;
  title: string;
  format: "TEAM_VS_TEAM" | "DUOS" | "SOLOS";
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  startAt: string;
  endAt: string;
  daysRemaining: number;
  totalDays: number;
  currentDayNumber: number;
  timeRemainingHuman: string;
  teams: ScoreboardTeam[];
  matchHeader: ScoreboardMatchHeader;
  standings: ScoreboardStandingEntry[];
  punishmentWall: PunishmentWallData;
  currentUser: {
    isLoggedIn: boolean;
    isEnrolled: boolean;
    participantId: string | null;
  };
}

export interface RawChallengePayload {
  id: string;
  title: string;
  format: "TEAM_VS_TEAM" | "DUOS" | "SOLOS";
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  startAt: Date;
  endAt: Date;
  punishmentPfpUrl: string | null;
  teams: Array<{
    id: string;
    name: string;
    color: string | null;
    iconEmoji: string | null;
    mascotUrl: string | null;
    sortOrder: number;
  }>;
  participants: Array<{
    id: string;
    userId: string;
    teamId: string;
    targetSeconds: number;
    status: "NORMAL" | "DEFICIT" | "EXCUSED" | "PUNISHED";
    user: {
      id: string;
      displayName: string | null;
      username: string | null;
      name: string | null;
      image: string | null;
    };
    dailyStudyLogs: Array<{
      durationSeconds: number;
    }>;
    weeklyGoals: Array<{
      id: string;
      description: string;
      completed: boolean;
    }>;
    punishmentRecord?: {
      isPunished: boolean;
      isPardoned: boolean;
      pardonReason: string | null;
      hoursDeficitSeconds: number;
      incompleteGoalsCount: number;
    } | null;
  }>;
}

export function buildScoreboardViewModel(
  challenge: RawChallengePayload,
  currentUserId?: string,
  now = new Date(),
): ChallengeScoreboardViewModel {
  const daysRemaining = calculateInclusiveDaysRemaining(challenge.endAt, now);
  const totalDays = Math.max(
    1,
    Math.ceil(
      (challenge.endAt.getTime() - challenge.startAt.getTime()) / 86_400_000,
    ),
  );
  const elapsedDays = Math.max(
    1,
    Math.min(
      totalDays,
      Math.ceil((now.getTime() - challenge.startAt.getTime()) / 86_400_000),
    ),
  );

  // 1. Participant logs mapping
  const participantScores = challenge.participants.map((p) => {
    const totalLoggedSeconds = sumLoggedSeconds(p.dailyStudyLogs);
    return {
      participantId: p.id,
      teamId: p.teamId,
      loggedSeconds: totalLoggedSeconds,
    };
  });

  // 2. Aggregate team scores (Law L1)
  const teamRefs: TeamRef[] = challenge.teams.map((t) => ({ id: t.id }));
  const teamAggregates = aggregateTeamScores(
    teamRefs,
    participantScores.map((ps) => ({
      teamId: ps.teamId,
      loggedSeconds: ps.loggedSeconds,
    })),
  );

  const teamScoreMap = new Map(
    teamAggregates.map((ta) => [ta.teamId, ta.totalSeconds]),
  );

  const highestTeamScore = teamAggregates[0]?.totalSeconds ?? 0;

  const companionCounts = new Map<string, number>();
  for (const p of challenge.participants) {
    companionCounts.set(p.teamId, (companionCounts.get(p.teamId) ?? 0) + 1);
  }

  const teams: ScoreboardTeam[] = challenge.teams.map((team) => {
    const totalLoggedSeconds = teamScoreMap.get(team.id) ?? 0;
    const isLeader =
      teamAggregates.length > 0 &&
      totalLoggedSeconds === highestTeamScore &&
      totalLoggedSeconds > 0;

    return {
      id: team.id,
      name: team.name,
      color: team.color,
      iconEmoji: team.iconEmoji,
      mascotUrl: team.mascotUrl,
      sortOrder: team.sortOrder,
      companionCount: companionCounts.get(team.id) ?? 0,
      totalLoggedSeconds,
      totalLoggedClock: formatSecondsToClock(totalLoggedSeconds),
      isLeader,
    };
  });

  // 3. Head-to-Head Banner (FEAT-LEAD-01)
  const sortedTeams = [...teams].sort(
    (a, b) =>
      b.totalLoggedSeconds - a.totalLoggedSeconds || a.sortOrder - b.sortOrder,
  );

  const teamA = sortedTeams[0] ?? null;
  const teamB = sortedTeams[1] ?? null;

  let leadMarginResult = {
    marginSeconds: 0,
    leader: "tie" as "a" | "b" | "tie",
    signedMarginSeconds: 0,
  };

  if (teamA && teamB) {
    leadMarginResult = calculateLeadMargin(
      teamA.totalLoggedSeconds,
      teamB.totalLoggedSeconds,
    );
  }

  const totalMatchSeconds =
    (teamA?.totalLoggedSeconds ?? 0) + (teamB?.totalLoggedSeconds ?? 0);
  const ratioPercentageA =
    totalMatchSeconds > 0 && teamA
      ? Math.round((teamA.totalLoggedSeconds / totalMatchSeconds) * 1000) / 10
      : 50;
  const ratioPercentageB =
    totalMatchSeconds > 0 ? Math.round((100 - ratioPercentageA) * 10) / 10 : 50;

  const matchHeader: ScoreboardMatchHeader = {
    hasMatchup: teams.length >= 2,
    teamA,
    teamB,
    leadMarginSeconds: leadMarginResult.marginSeconds,
    leadMarginClock: formatSecondsToClock(leadMarginResult.marginSeconds),
    leadMarginHuman: formatSecondsToHuman(leadMarginResult.marginSeconds),
    leaderTeamId:
      leadMarginResult.leader === "a" && teamA
        ? teamA.id
        : leadMarginResult.leader === "b" && teamB
          ? teamB.id
          : null,
    leaderSide: leadMarginResult.leader,
    ratioPercentageA,
    ratioPercentageB,
  };

  // 4. Standings rows (FEAT-LEAD-02)
  const teamLookup = new Map(challenge.teams.map((t) => [t.id, t]));

  const participantRows = challenge.participants.map((p) => {
    const totalLoggedSeconds = sumLoggedSeconds(p.dailyStudyLogs);
    const goalsCompletedCount = p.weeklyGoals.filter((g) => g.completed).length;
    const goalsTotalCount = p.weeklyGoals.length;
    const deficitSeconds = Math.max(0, p.targetSeconds - totalLoggedSeconds);

    const completionPercentage =
      p.targetSeconds > 0
        ? Math.min(
            100,
            Math.round((totalLoggedSeconds / p.targetSeconds) * 100),
          )
        : 100;

    let paceStatus: ParticipantPaceStatus = "on-track";
    let paceLabel = "On Track";

    if (challenge.status === "COMPLETED") {
      if (p.status === "EXCUSED" || p.punishmentRecord?.isPardoned) {
        paceStatus = "excused";
        paceLabel = "Excused";
      } else if (
        p.status === "PUNISHED" ||
        p.punishmentRecord?.isPunished ||
        deficitSeconds > 0 ||
        (goalsTotalCount > 0 && goalsCompletedCount < goalsTotalCount)
      ) {
        paceStatus = "punished";
        paceLabel = "Punished";
      } else {
        paceStatus = "serene";
        paceLabel = "Completed";
      }
    } else {
      if (
        deficitSeconds === 0 &&
        (goalsTotalCount === 0 || goalsCompletedCount === goalsTotalCount)
      ) {
        paceStatus = "serene";
        paceLabel = "Serene";
      } else if (deficitSeconds > 0) {
        paceStatus = "catch-up";
        paceLabel = "Catch-Up";
      } else {
        paceStatus = "on-track";
        paceLabel = "On Track";
      }
    }

    const team = teamLookup.get(p.teamId);

    return {
      participantId: p.id,
      userId: p.userId,
      displayName:
        p.user.displayName ?? p.user.name ?? p.user.username ?? "Anonymous",
      username: p.user.username,
      image: p.user.image,
      teamId: p.teamId,
      teamName: team?.name ?? "Independent",
      teamColor: team?.color ?? null,
      teamIcon: team?.iconEmoji ?? null,
      totalLoggedSeconds,
      totalLoggedClock: formatSecondsToClock(totalLoggedSeconds),
      targetSeconds: p.targetSeconds,
      targetClock: formatSecondsToClock(p.targetSeconds),
      completionPercentage,
      goalsCompletedCount,
      goalsTotalCount,
      paceStatus,
      paceLabel,
      deficitSeconds,
    };
  });

  // Sort descending by totalLoggedSeconds, then more goals completed
  participantRows.sort((a, b) => {
    if (b.totalLoggedSeconds !== a.totalLoggedSeconds) {
      return b.totalLoggedSeconds - a.totalLoggedSeconds;
    }
    if (b.goalsCompletedCount !== a.goalsCompletedCount) {
      return b.goalsCompletedCount - a.goalsCompletedCount;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  const standings: ScoreboardStandingEntry[] = participantRows.map(
    (row, idx) => ({
      ...row,
      rank: idx + 1,
    }),
  );

  // 5. Punishment Wall data (FEAT-PUN-02, FEAT-PUN-03, Law L6)
  const isEventCompleted = challenge.status === "COMPLETED";
  const defaultPunishmentPfp = "/assets/punishment_pfp.jpg";

  const flaggedMembers: FlaggedPunishmentMember[] = [];

  for (const p of challenge.participants) {
    const totalLoggedSeconds = sumLoggedSeconds(p.dailyStudyLogs);
    const goalsStatusList: WeeklyGoalStatus[] = p.weeklyGoals.map((g) => ({
      completed: g.completed,
    }));

    const evaluation = evaluateParticipantPunishment(
      p.targetSeconds,
      totalLoggedSeconds,
      goalsStatusList,
    );

    const isExplicitlyPunished =
      p.status === "PUNISHED" || Boolean(p.punishmentRecord?.isPunished);
    const isPardoned =
      p.status === "EXCUSED" || Boolean(p.punishmentRecord?.isPardoned);

    const shouldFlag = isEventCompleted
      ? evaluation.isPunished || isExplicitlyPunished
      : evaluation.isPunished &&
        (evaluation.hoursDeficitSeconds > 0 || evaluation.incompleteGoals > 0);

    if (shouldFlag) {
      const team = teamLookup.get(p.teamId);
      const hoursDeficitSeconds =
        p.punishmentRecord?.hoursDeficitSeconds ??
        evaluation.hoursDeficitSeconds;
      const incompleteGoalsCount =
        p.punishmentRecord?.incompleteGoalsCount ?? evaluation.incompleteGoals;

      let statusBadge: "Catch-Up" | "Punished" | "Excused" = "Catch-Up";
      if (isPardoned) {
        statusBadge = "Excused";
      } else if (isEventCompleted || isExplicitlyPunished) {
        statusBadge = "Punished";
      }

      flaggedMembers.push({
        participantId: p.id,
        userId: p.userId,
        displayName:
          p.user.displayName ?? p.user.name ?? p.user.username ?? "Anonymous",
        username: p.user.username,
        image: p.user.image,
        teamName: team?.name ?? "Independent",
        teamIcon: team?.iconEmoji ?? null,
        hoursDeficitSeconds,
        hoursDeficitClock: formatSecondsToClock(hoursDeficitSeconds),
        incompleteGoalsCount,
        isPardoned,
        pardonReason: p.punishmentRecord?.pardonReason ?? null,
        statusBadge,
      });
    }
  }

  // Sort flagged members by deficit descending
  flaggedMembers.sort(
    (a, b) =>
      b.hoursDeficitSeconds - a.hoursDeficitSeconds ||
      b.incompleteGoalsCount - a.incompleteGoalsCount,
  );

  const currentUserParticipant = currentUserId
    ? challenge.participants.find((p) => p.userId === currentUserId)
    : undefined;

  const timeRemainingMs = challenge.endAt.getTime() - now.getTime();
  let timeRemainingHuman = "Event concluded";
  if (timeRemainingMs > 0) {
    const totalRemainingSecs = Math.floor(timeRemainingMs / 1000);
    const remDays = Math.floor(totalRemainingSecs / 86400);
    const remHours = Math.floor((totalRemainingSecs % 86400) / 3600);
    const remMins = Math.floor((totalRemainingSecs % 3600) / 60);
    timeRemainingHuman = `${remDays}d ${remHours.toString().padStart(2, "0")}h ${remMins.toString().padStart(2, "0")}m`;
  }

  return {
    id: challenge.id,
    title: challenge.title,
    format: challenge.format,
    status: challenge.status,
    startAt: challenge.startAt.toISOString(),
    endAt: challenge.endAt.toISOString(),
    daysRemaining,
    totalDays,
    currentDayNumber: elapsedDays,
    timeRemainingHuman,
    teams,
    matchHeader,
    standings,
    punishmentWall: {
      punishmentPfpUrl: challenge.punishmentPfpUrl ?? defaultPunishmentPfp,
      flaggedMembers,
      isEventCompleted,
    },
    currentUser: {
      isLoggedIn: Boolean(currentUserId),
      isEnrolled: Boolean(currentUserParticipant),
      participantId: currentUserParticipant?.id ?? null,
    },
  };
}

export async function getChallengeScoreboard(
  challengeId: string,
  currentUserId?: string,
): Promise<ChallengeScoreboardViewModel | null> {
  const challenges = await prisma.challenge.findMany();

  console.log("All challenges:", challenges);

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      teams: {
        orderBy: { sortOrder: "asc" },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true,
              name: true,
              image: true,
            },
          },
          dailyStudyLogs: {
            select: {
              durationSeconds: true,
            },
          },
          weeklyGoals: {
            select: {
              id: true,
              description: true,
              completed: true,
            },
          },
          punishmentRecord: {
            select: {
              isPunished: true,
              isPardoned: true,
              pardonReason: true,
              hoursDeficitSeconds: true,
              incompleteGoalsCount: true,
            },
          },
        },
      },
    },
  });

  if (!challenge) {
    return null;
  }

  return buildScoreboardViewModel(
    challenge as unknown as RawChallengePayload,
    currentUserId,
  );
}
