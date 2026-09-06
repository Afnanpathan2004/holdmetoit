import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/db";

export type AuditActionType =
  | "CHALLENGE_CREATED"
  | "CHALLENGE_KICKOFF"
  | "CHALLENGE_LOCKED"
  | "PARTICIPANT_ENROLLED"
  | "HOURS_OVERRIDE"
  | "GOAL_EDIT"
  | "GOAL_UNLOCK"
  | "PARTICIPANT_PARDONED"
  | "PARDON_REVOKED"
  | "DUO_RENAMED";

export type AuditEntityType =
  | "CHALLENGE"
  | "PARTICIPANT"
  | "DAILY_STUDY_LOG"
  | "WEEKLY_GOAL"
  | "TEAM";

export interface CreateAuditEntryInput {
  actorId: string;
  actorUsername: string;
  actionType: AuditActionType;
  targetEntityId: string;
  targetEntityType: AuditEntityType;
  previousValue?: Record<string, unknown> | string | null;
  newValue?: Record<string, unknown> | string | null;
  auditReason?: string | null;
}

type DbClient = typeof prisma | Prisma.TransactionClient;

function serializeSnapshot(
  value?: Record<string, unknown> | string | null,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Creates an immutable, append-only audit log entry (FEAT-AUDIT-01).
 * Strict immutability: zero update or delete methods exist in this module.
 */
export async function createAuditEntry(
  input: CreateAuditEntryInput,
  client: DbClient = prisma,
) {
  return client.auditLog.create({
    data: {
      actorId: input.actorId,
      actorUsername: input.actorUsername,
      actionType: input.actionType,
      targetEntityId: input.targetEntityId,
      targetEntityType: input.targetEntityType,
      previousValue: serializeSnapshot(input.previousValue),
      newValue: serializeSnapshot(input.newValue),
      auditReason: input.auditReason ?? null,
    },
  });
}

export async function getAuditLogsForEntity(
  targetEntityId: string,
  limit = 50,
) {
  return prisma.auditLog.findMany({
    where: { targetEntityId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

export async function getAuditLogsForEntities(
  targetEntityIds: string[],
  limit = 50,
) {
  if (targetEntityIds.length === 0) return [];
  return prisma.auditLog.findMany({
    where: { targetEntityId: { in: targetEntityIds } },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

export async function getRecentAuditLogs(limit = 50) {
  return prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}
