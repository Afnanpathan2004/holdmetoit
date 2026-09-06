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

/**
 * Admin goal editing with audit logging (FEAT-DECL-04).
 */
export async function adminEditGoal(params: {
  challengeId?: string;
  goalId: string;
  description: string;
  reason: string;
  actor: { id: string; username: string };
}) {
  const trimmedDesc = params.description.trim();
  const trimmedReason = params.reason.trim();
  if (!trimmedDesc) throw new Error("Goal description cannot be empty.");
  if (!trimmedReason)
    throw new Error("Audit reason is required for goal modification.");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.weeklyGoal.findUnique({
      where: { id: params.goalId },
      include: { participant: { select: { challengeId: true } } },
    });
    if (!existing) throw new Error("Goal not found.");
    if (params.challengeId && existing.participant.challengeId !== params.challengeId) {
      throw new Error("Goal does not belong to this challenge.");
    }

    const updated = await tx.weeklyGoal.update({
      where: { id: params.goalId },
      data: { description: trimmedDesc },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actor.id,
        actorUsername: params.actor.username,
        actionType: "GOAL_EDIT",
        targetEntityId: params.goalId,
        targetEntityType: "WEEKLY_GOAL",
        previousValue: JSON.stringify({ description: existing.description }),
        newValue: JSON.stringify({ description: trimmedDesc }),
        auditReason: trimmedReason,
      },
    });

    return updated;
  });
}

export async function adminToggleGoalCompletion(params: {
  challengeId?: string;
  goalId: string;
  completed: boolean;
  reason: string;
  actor: { id: string; username: string };
}) {
  const trimmedReason = params.reason.trim();
  if (!trimmedReason) throw new Error("Audit reason is required.");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.weeklyGoal.findUnique({
      where: { id: params.goalId },
      include: { participant: { select: { challengeId: true } } },
    });
    if (!existing) throw new Error("Goal not found.");
    if (params.challengeId && existing.participant.challengeId !== params.challengeId) {
      throw new Error("Goal does not belong to this challenge.");
    }

    const updated = await tx.weeklyGoal.update({
      where: { id: params.goalId },
      data: {
        completed: params.completed,
        completedAt: params.completed ? new Date() : null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actor.id,
        actorUsername: params.actor.username,
        actionType: "GOAL_EDIT",
        targetEntityId: params.goalId,
        targetEntityType: "WEEKLY_GOAL",
        previousValue: JSON.stringify({ completed: existing.completed }),
        newValue: JSON.stringify({ completed: params.completed }),
        auditReason: trimmedReason,
      },
    });

    return updated;
  });
}

export async function adminAddGoal(params: {
  challengeId?: string;
  participantId: string;
  description: string;
  reason: string;
  actor: { id: string; username: string };
}) {
  const trimmedDesc = params.description.trim();
  const trimmedReason = params.reason.trim();
  if (!trimmedDesc) throw new Error("Goal description cannot be empty.");
  if (!trimmedReason) throw new Error("Audit reason is required.");

  return prisma.$transaction(async (tx) => {
    if (params.challengeId) {
      const participant = await tx.challengeParticipant.findUnique({
        where: { id: params.participantId },
        select: { challengeId: true },
      });
      if (!participant) throw new Error("Participant not found.");
      if (participant.challengeId !== params.challengeId) {
        throw new Error("Participant does not belong to this challenge.");
      }
    }

    const currentGoals = await tx.weeklyGoal.findMany({
      where: { participantId: params.participantId },
      orderBy: { sortOrder: "desc" },
    });

    if (currentGoals.length >= 10) {
      throw new Error("Cannot have more than 10 weekly goals.");
    }

    const nextSortOrder =
      currentGoals.length > 0 ? currentGoals[0].sortOrder + 1 : 0;

    const created = await tx.weeklyGoal.create({
      data: {
        participantId: params.participantId,
        description: trimmedDesc,
        sortOrder: nextSortOrder,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actor.id,
        actorUsername: params.actor.username,
        actionType: "GOAL_EDIT",
        targetEntityId: created.id,
        targetEntityType: "WEEKLY_GOAL",
        newValue: JSON.stringify({ description: trimmedDesc }),
        auditReason: trimmedReason,
      },
    });

    return created;
  });
}

