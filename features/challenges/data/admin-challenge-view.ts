import { prisma } from "@/core/db";
import { getAuditTrail } from "@/features/audit/data/audit-log.repository";
import { listAllUsersForAdmin } from "@/features/auth/data/user.repository";
import type {
  AdminChallengeViewModel,
} from "@/features/challenges/presentation/admin-challenge-console";
import type { DiscordSummaryInput } from "@/features/notifications/domain/discord-summary";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";

export async function getAdminChallengeData(
  challengeId: string,
): Promise<AdminChallengeViewModel | null> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      host: {
        select: {
          id: true,
          displayName: true,
          username: true,
        },
      },
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
              image: true,
            },
          },
          team: true,
          dailyStudyLogs: {
            orderBy: { logDate: "asc" },
            include: {
              overrideBy: {
                select: { username: true, displayName: true },
              },
            },
          },
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

  const auditEvents = await getAuditTrail(challengeId);

  // Compute team cumulative hours
  const teamScores = new Map<string, number>();
  for (const team of challenge.teams) {
    teamScores.set(team.id, 0);
  }

  challenge.participants.forEach((p) => {
    const pTotal = p.dailyStudyLogs.reduce(
      (sum, l) => sum + l.durationSeconds,
      0,
    );
    const curr = teamScores.get(p.teamId) ?? 0;
    teamScores.set(p.teamId, curr + pTotal);
  });

  const teamsViewModel = challenge.teams.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    iconEmoji: t.iconEmoji,
    participantCount: challenge.participants.filter((p) => p.teamId === t.id)
      .length,
    totalLoggedSeconds: teamScores.get(t.id) ?? 0,
  }));

  const maxTeamScore = Math.max(
    0,
    ...teamsViewModel.map((t) => t.totalLoggedSeconds),
  );

  // Build roster
  const roster = challenge.participants.map((p) => ({
    id: p.id,
    userId: p.userId,
    displayName:
      p.user.displayName ?? p.user.username ?? "Anonymous Participant",
    username: p.user.username,
    image: p.user.image,
    teamName: p.team.name,
    teamColor: p.team.color,
    teamIcon: p.team.iconEmoji,
    targetSeconds: p.targetSeconds,
    status: p.status,
    dailyLogs: p.dailyStudyLogs.map((log) => ({
      id: log.id,
      logDate: log.logDate.toISOString().split("T")[0],
      durationSeconds: log.durationSeconds,
      isOverride: log.isOverride,
      overrideReason: log.overrideReason,
      overrideByUsername:
        log.overrideBy?.displayName ?? log.overrideBy?.username ?? null,
    })),
    goalsCount: p.weeklyGoals.length,
    goalsCompletedCount: p.weeklyGoals.filter((g) => g.completed).length,
  }));

  // Build goals and pardons list
  const goalsAndPardons = challenge.participants.map((p) => ({
    id: p.id,
    userId: p.userId,
    displayName:
      p.user.displayName ?? p.user.username ?? "Anonymous Participant",
    teamName: p.team.name,
    status: p.status,
    goals: p.weeklyGoals.map((g) => ({
      id: g.id,
      description: g.description,
      completed: g.completed,
    })),
    punishmentRecord: p.punishmentRecord
      ? {
          isPunished: p.punishmentRecord.isPunished,
          isPardoned: p.punishmentRecord.isPardoned,
          pardonReason: p.punishmentRecord.pardonReason,
          hoursDeficitSeconds: p.punishmentRecord.hoursDeficitSeconds,
          incompleteGoalsCount: p.punishmentRecord.incompleteGoalsCount,
        }
      : null,
  }));

  // Build podium for discord summary (top 3 by logged seconds)
  const rankedParticipants = [...challenge.participants]
    .map((p) => {
      const totalSecs = p.dailyStudyLogs.reduce(
        (acc, l) => acc + l.durationSeconds,
        0,
      );
      return {
        displayName:
          p.user.displayName ?? p.user.username ?? "Anonymous Participant",
        username: p.user.username,
        teamName: p.team.name,
        totalLoggedSeconds: totalSecs,
      };
    })
    .sort((a, b) => b.totalLoggedSeconds - a.totalLoggedSeconds);

  const podium = rankedParticipants.slice(0, 3).map((p, idx) => ({
    rank: (idx + 1) as 1 | 2 | 3,
    displayName: p.displayName,
    username: p.username,
    teamName: p.teamName,
    totalLoggedSeconds: p.totalLoggedSeconds,
  }));

  // Punished members for discord summary
  const punishedMembers = challenge.participants
    .filter(
      (p) =>
        p.status === "PUNISHED" ||
        p.status === "EXCUSED" ||
        p.punishmentRecord?.isPunished,
    )
    .map((p) => ({
      displayName:
        p.user.displayName ?? p.user.username ?? "Anonymous Participant",
      username: p.user.username,
      hoursDeficitSeconds: p.punishmentRecord?.hoursDeficitSeconds ?? 0,
      incompleteGoalsCount: p.punishmentRecord?.incompleteGoalsCount ?? 0,
      isPardoned:
        p.status === "EXCUSED" || (p.punishmentRecord?.isPardoned ?? false),
      pardonReason: p.punishmentRecord?.pardonReason ?? null,
    }));

  const discordSummary: DiscordSummaryInput = {
    title: challenge.title,
    status: challenge.status,
    startDate: challenge.startAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    endDate: challenge.endAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    teams: teamsViewModel.map((t) => ({
      name: t.name,
      iconEmoji: t.iconEmoji,
      totalLoggedSeconds: t.totalLoggedSeconds,
      isLeader: t.totalLoggedSeconds === maxTeamScore && maxTeamScore > 0,
    })),
    podium,
    punishedMembers,
  };

  const allUsers = await listAllUsersForAdmin();
  const enrolledUserIds = new Set(challenge.participants.map((p) => p.userId));
  const availableUsers = allUsers.map((u) => ({
    id: u.id,
    displayName: u.displayName ?? u.username ?? "Anonymous User",
    username: u.username,
    image: u.image,
    isEnrolled: enrolledUserIds.has(u.id),
  }));

  return {
    id: challenge.id,
    title: challenge.title,
    format: challenge.format,
    status: challenge.status,
    startAt: challenge.startAt.toISOString(),
    endAt: challenge.endAt.toISOString(),
    punishmentPfpUrl: challenge.punishmentPfpUrl,
    host: challenge.host,
    teams: teamsViewModel,
    roster,
    goalsAndPardons,
    auditTrail: auditEvents,
    discordSummary,
    availableUsers,
  };
}
