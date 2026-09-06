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

  return prisma.challengeParticipant.findFirst({
    where: {
      userId,
      challenge: { status: "UPCOMING" },
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
