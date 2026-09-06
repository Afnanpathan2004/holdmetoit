export type AuditEventType =
  | "HOURS_OVERRIDE"
  | "GOAL_EDIT"
  | "GOAL_UNLOCK"
  | "PARTICIPANT_PARDONED"
  | "CHALLENGE_KICKOFF"
  | "CHALLENGE_LOCKED"
  | "CHALLENGE_CREATED"
  | "ROSTER_EDIT";

export type AuditTargetType =
  | "DAILY_STUDY_LOG"
  | "WEEKLY_GOAL"
  | "CHALLENGE"
  | "PARTICIPANT"
  | "TEAM";

export interface AuditEvent {
  id: string;
  timestamp: string; // ISO 8601 UTC
  actorId: string;
  actorUsername: string;
  actionType: AuditEventType;
  targetEntityId: string;
  targetEntityType: AuditTargetType;
  challengeId?: string;
  previousValue: unknown;
  newValue: unknown;
  auditReason: string | null;
}

export interface CreateAuditEventParams {
  id?: string;
  timestamp?: Date | string;
  actorId: string;
  actorUsername: string;
  actionType: AuditEventType;
  targetEntityId: string;
  targetEntityType: AuditTargetType;
  challengeId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  auditReason?: string | null;
}

/**
 * Creates a normalized, immutable audit event envelope conforming to FEAT-AUDIT-01.
 */
export function createAuditEnvelope(params: CreateAuditEventParams): AuditEvent {
  if (!params.actorId || !params.actorId.trim()) {
    throw new Error("Audit actorId cannot be empty.");
  }
  if (!params.actorUsername || !params.actorUsername.trim()) {
    throw new Error("Audit actorUsername cannot be empty.");
  }
  if (!params.targetEntityId || !params.targetEntityId.trim()) {
    throw new Error("Audit targetEntityId cannot be empty.");
  }

  const timestamp = params.timestamp
    ? typeof params.timestamp === "string"
      ? params.timestamp
      : params.timestamp.toISOString()
    : new Date().toISOString();

  const id =
    params.id ??
    `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    id,
    timestamp,
    actorId: params.actorId.trim(),
    actorUsername: params.actorUsername.trim(),
    actionType: params.actionType,
    targetEntityId: params.targetEntityId.trim(),
    targetEntityType: params.targetEntityType,
    challengeId: params.challengeId?.trim(),
    previousValue: params.previousValue ?? null,
    newValue: params.newValue ?? null,
    auditReason: params.auditReason ? params.auditReason.trim() : null,
  };
}

/**
 * Maps an audit action type to a human-readable title.
 */
export function formatAuditActionHuman(action: AuditEventType): string {
  switch (action) {
    case "HOURS_OVERRIDE":
      return "Study Hours Adjusted";
    case "GOAL_EDIT":
      return "Weekly Goal Modified";
    case "GOAL_UNLOCK":
      return "Weekly Goal Unlocked";
    case "PARTICIPANT_PARDONED":
      return "Participant Pardoned";
    case "CHALLENGE_KICKOFF":
      return "Event Kickoff Triggered";
    case "CHALLENGE_LOCKED":
      return "Final Results Locked";
    case "CHALLENGE_CREATED":
      return "Challenge Created";
    case "ROSTER_EDIT":
      return "Team Roster Reassigned";
    default:
      return action;
  }
}

/**
 * Exports the complete audit trail as formatted JSON for offline archival.
 */
export function exportAuditTrailToJson(events: readonly AuditEvent[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      schemaVersion: "1.0",
      totalEvents: events.length,
      events,
    },
    null,
    2,
  );
}
