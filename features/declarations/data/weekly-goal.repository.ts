import { prisma } from "@/core/db";

export async function replaceWeeklyGoals(
  participantId: string,
  descriptions: string[],
) {
  return prisma.$transaction(async (tx) => {
    await tx.weeklyGoal.deleteMany({ where: { participantId } });

    await tx.weeklyGoal.createMany({
      data: descriptions.map((description, index) => ({
        participantId,
        description,
        sortOrder: index,
      })),
    });

    return tx.weeklyGoal.findMany({
      where: { participantId },
      orderBy: { sortOrder: "asc" },
    });
  });
}

export async function setWeeklyGoalCompleted(
  participantId: string,
  goalId: string,
  completed: boolean,
) {
  const goal = await prisma.weeklyGoal.findFirst({
    where: {
      id: goalId,
      participantId,
    },
  });

  if (!goal) {
    return null;
  }

  return prisma.weeklyGoal.update({
    where: { id: goalId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });
}

export async function updateParticipantTargetSeconds(
  participantId: string,
  targetSeconds: number,
) {
  return prisma.challengeParticipant.update({
    where: { id: participantId },
    data: { targetSeconds },
  });
}
