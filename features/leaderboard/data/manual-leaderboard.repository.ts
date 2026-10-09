import { prisma } from "@/core/db";
import { calculateChallengeStatus } from "@/features/challenges/domain/challenge-lifecycle";
import {
  aggregateManualLeaderboard,
  type LeaderboardEntryRef,
  type ManualLeaderboardSummary,
  type TeamMemberRef,
  type TeamRef,
  type UserRef,
} from "@/features/leaderboard/domain/manual-leaderboard";

export interface ManualLeaderboardChallengeDetails {
  id: string;
  challengeName: string;
  challengeColor: string | null;
  punishmentPfp: string | null;
  startAt: string;
  endAt: string;
  status: string;
}

export interface ManualLeaderboardViewModel {
  challenge: ManualLeaderboardChallengeDetails;
  summary: ManualLeaderboardSummary;
}

/**
 * Fetches all challenge, team, and participant entries directly from Prisma (no Redis, no WebSockets).
 */
export async function getManualLeaderboardData(
  challengeId: string,
): Promise<ManualLeaderboardViewModel | null> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      teams: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  username: true,
                  name: true,
                  discordId: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      leaderboardEntries: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true,
              name: true,
              discordId: true,
              image: true,
            },
          },
        },
        orderBy: { slotDate: "asc" },
      },
    },
  });

  if (!challenge) {
    return null;
  }

  // 1. Gather all unique users participating in teams or having entries
  const userMap = new Map<string, UserRef>();

  for (const team of challenge.teams) {
    for (const member of team.members) {
      const u = member.user;
      if (!userMap.has(u.id)) {
        userMap.set(u.id, {
          id: u.id,
          discordName: u.displayName ?? u.username ?? u.name ?? "Anonymous",
          discordId: u.discordId,
          userPfp: u.image,
        });
      }
    }
  }

  for (const entry of challenge.leaderboardEntries) {
    const u = entry.user;
    if (!userMap.has(u.id)) {
      userMap.set(u.id, {
        id: u.id,
        discordName: u.displayName ?? u.username ?? u.name ?? "Anonymous",
        discordId: u.discordId,
        userPfp: u.image,
      });
    }
  }

  const users: UserRef[] = Array.from(userMap.values());

  // 2. Map teams
  const teams: TeamRef[] = challenge.teams.map((t) => ({
    id: t.id,
    name: t.name,
    challengeId: t.challengeId,
  }));

  // 3. Map team memberships
  const teamMembers: TeamMemberRef[] = [];
  for (const team of challenge.teams) {
    for (const member of team.members) {
      teamMembers.push({
        teamId: member.teamId,
        userId: member.userId,
      });
    }
  }

  // 4. Map entries
  const entries: LeaderboardEntryRef[] = challenge.leaderboardEntries.map(
    (e) => ({
      id: e.id,
      challengeId: e.challengeId,
      userId: e.userId,
      sessionHours: Number(e.sessionHours),
      slotDate: e.slotDate.toISOString().split("T")[0]!,
    }),
  );

  // 5. Aggregate with pure domain math
  const summary = aggregateManualLeaderboard(
    users,
    teams,
    teamMembers,
    entries,
  );

  return {
    challenge: {
      id: challenge.id,
      challengeName: challenge.title,
      challengeColor: challenge.challengeColor,
      punishmentPfp: challenge.punishmentPfpUrl,
      startAt: challenge.startAt.toISOString(),
      endAt: challenge.endAt.toISOString(),
      status: calculateChallengeStatus(challenge),
    },
    summary,
  };
}

/**
 * Upserts a manual session hours entry for a user on a given slot date.
 */
export async function upsertManualLeaderboardEntry(input: {
  challengeId: string;
  userId: string;
  slotDate: Date;
  sessionHours: number;
}) {
  return prisma.leaderboardEntry.upsert({
    where: {
      challengeId_userId_slotDate: {
        challengeId: input.challengeId,
        userId: input.userId,
        slotDate: input.slotDate,
      },
    },
    update: {
      sessionHours: input.sessionHours,
    },
    create: {
      challengeId: input.challengeId,
      userId: input.userId,
      slotDate: input.slotDate,
      sessionHours: input.sessionHours,
    },
  });
}

/**
 * Bulk upserts multiple entries for a challenge in a single database transaction.
 */
export async function batchUpsertManualLeaderboardEntries(
  challengeId: string,
  entries: Array<{
    userId: string;
    slotDate: Date;
    sessionHours: number;
  }>,
) {
  return prisma.$transaction(
    entries.map((entry) =>
      prisma.leaderboardEntry.upsert({
        where: {
          challengeId_userId_slotDate: {
            challengeId,
            userId: entry.userId,
            slotDate: entry.slotDate,
          },
        },
        update: {
          sessionHours: entry.sessionHours,
        },
        create: {
          challengeId,
          userId: entry.userId,
          slotDate: entry.slotDate,
          sessionHours: entry.sessionHours,
        },
      }),
    ),
  );
}

/**
 * Assigns a user to a team.
 */
export async function assignTeamMember(teamId: string, userId: string) {
  return prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    update: {},
    create: {
      teamId,
      userId,
    },
  });
}
