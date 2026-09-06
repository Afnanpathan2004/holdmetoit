import { prisma } from "@/core/db";
import { recordAuditEvent } from "@/features/audit/data/audit-log.repository";

export async function adminEditGoal(params: {
  goalId: string;
  description: string;
  completed: boolean;
  reason: string;
  admin: { id: string; username: string };
}) {
  const existingGoal = await prisma.weeklyGoal.findUnique({
    where: { id: params.goalId },
    include: { participant: { select: { challengeId: true } } },
  });

  if (!existingGoal) {
    throw new Error("Weekly goal not found.");
  }

  const updated = await prisma.weeklyGoal.update({
    where: { id: params.goalId },
    data: {
      description: params.description.trim(),
      completed: params.completed,
      completedAt: params.completed ? new Date() : null,
    },
  });

  await recordAuditEvent({
    actorId: params.admin.id,
    actorUsername: params.admin.username,
    actionType: "GOAL_EDIT",
    targetEntityId: params.goalId,
    targetEntityType: "WEEKLY_GOAL",
    challengeId: existingGoal.participant.challengeId,
    previousValue: {
      description: existingGoal.description,
      completed: existingGoal.completed,
    },
    newValue: {
      description: updated.description,
      completed: updated.completed,
    },
    auditReason: params.reason.trim(),
  });

  return updated;
}

export async function adminAddGoal(params: {
  participantId: string;
  description: string;
  reason: string;
  admin: { id: string; username: string };
}) {
  const participant = await prisma.challengeParticipant.findUnique({
    where: { id: params.participantId },
    include: { weeklyGoals: true },
  });

  if (!participant) {
    throw new Error("Participant not found.");
  }

  const newGoal = await prisma.weeklyGoal.create({
    data: {
      participantId: params.participantId,
      description: params.description.trim(),
      sortOrder: participant.weeklyGoals.length,
      completed: false,
    },
  });

  await recordAuditEvent({
    actorId: params.admin.id,
    actorUsername: params.admin.username,
    actionType: "GOAL_EDIT",
    targetEntityId: newGoal.id,
    targetEntityType: "WEEKLY_GOAL",
    challengeId: participant.challengeId,
    previousValue: null,
    newValue: {
      description: newGoal.description,
      sortOrder: newGoal.sortOrder,
    },
    auditReason: params.reason.trim(),
  });

  return newGoal;
}
