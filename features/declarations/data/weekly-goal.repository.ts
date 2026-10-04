import { prisma } from "@/core/db";

export async function replaceWeeklyGoals(
  _participantId: string,
  _descriptions: string[],
) {
  return [];
}

export async function setWeeklyGoalCompleted(
  _participantId: string,
  _goalId: string,
  _completed: boolean,
) {
  return null;
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
