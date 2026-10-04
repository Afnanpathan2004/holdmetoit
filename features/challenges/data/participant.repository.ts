import { prisma } from "@/core/db";

export async function findParticipantForUser(
  userId: string,
  challengeId?: string,
) {
  const include = {
    challenge: true,
    team: true,
    user: true,
    dailyStudyLogs: {
      orderBy: { logDate: "asc" as const },
    },
    weeklyGoals: {
      orderBy: { sortOrder: "asc" as const },
    },
  };

  if (challengeId) {
    return prisma.challengeParticipant.findFirst({
      where: { userId, challengeId },
      include,
    });
  }

  const activeParticipant = await prisma.challengeParticipant.findFirst({
    where: {
      userId,
      challenge: { status: "ACTIVE" },
    },
    include,
    orderBy: { enrolledAt: "desc" },
  });

  if (activeParticipant) {
    return activeParticipant;
  }

  const upcomingParticipant = await prisma.challengeParticipant.findFirst({
    where: {
      userId,
      challenge: { status: "UPCOMING" },
    },
    include,
    orderBy: { enrolledAt: "desc" },
  });

  if (upcomingParticipant) {
    return upcomingParticipant;
  }

  return prisma.challengeParticipant.findFirst({
    where: {
      userId,
      challenge: { status: "COMPLETED" },
    },
    include,
    orderBy: { enrolledAt: "desc" },
  });
}

export async function findOwnedParticipant(
  userId: string,
  challengeId: string,
) {
  return prisma.challengeParticipant.findFirst({
    where: {
      userId,
      challengeId,
    },
    include: {
      challenge: true,
    },
  });
}

export async function enrollParticipantInChallenge(params: {
  userId: string;
  challengeId: string;
  teamId?: string | null;
  targetSeconds?: number;
}) {
  const hasTeam = Boolean(params.teamId && params.teamId !== "no-assigned");

  const [challenge, existing, team] = await Promise.all([
    prisma.challenge.findUnique({
      where: { id: params.challengeId },
    }),
    prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId: params.challengeId,
          userId: params.userId,
        },
      },
    }),
    hasTeam
      ? prisma.team.findUnique({
          where: { id: params.teamId! },
          include: {
            _count: {
              select: { participants: true },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  if (challenge.status === "COMPLETED") {
    throw new Error("Cannot enroll in a completed challenge.");
  }

  if (existing) {
    throw new Error("User is already enrolled in this challenge.");
  }

  if (hasTeam) {
    if (!team || team.challengeId !== params.challengeId) {
      throw new Error("Selected team does not belong to this challenge.");
    }

    if (team.maxMembers && team._count.participants >= team.maxMembers) {
      throw new Error(
        `Team ${team.name} is full (max ${team.maxMembers} member${team.maxMembers === 1 ? "" : "s"}).`,
      );
    }
  }

  return prisma.challengeParticipant.create({
    data: {
      userId: params.userId,
      challengeId: params.challengeId,
      teamId: hasTeam ? params.teamId! : null,
      targetSeconds: params.targetSeconds ?? 0,
      status: "NORMAL",
    },
    include: {
      team: true,
      challenge: true,
      user: true,
    },
  });
}

