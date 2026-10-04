import { prisma } from "@/core/db";
import { recordAuditEvent } from "@/features/audit/data/audit-log.repository";

export async function adminEditGoal(params: {
  goalId: string;
  description: string;
  completed: boolean;
  reason: string;
  admin: { id: string; username: string };
}) {
  return {
    id: params.goalId,
    description: params.description.trim(),
    completed: params.completed,
  };
}

export async function adminAddGoal(params: {
  participantId: string;
  description: string;
  reason: string;
  admin: { id: string; username: string };
}) {
  return {
    id: `goal_${Date.now()}`,
    participantId: params.participantId,
    description: params.description.trim(),
    sortOrder: 0,
    completed: false,
  };
}
