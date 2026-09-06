import {
  createAuditEnvelope,
  type AuditEvent,
  type CreateAuditEventParams,
} from "@/features/audit/domain/audit-log";

// Append-only in-memory storage for audit logs (tamper-proof: append and read-only)
const auditTrailStorage: AuditEvent[] = [];

/**
 * Appends a new immutable audit record to the system audit trail (FEAT-AUDIT-01).
 * Invariant: Strictly append-only. No update or delete operations are exposed.
 */
export async function recordAuditEvent(
  params: CreateAuditEventParams,
): Promise<AuditEvent> {
  const envelope = createAuditEnvelope(params);
  auditTrailStorage.push(Object.freeze({ ...envelope }));
  return envelope;
}

/**
 * Retrieves the audit trail, optionally filtered by challengeId, sorted descending by timestamp.
 */
export async function getAuditTrail(
  challengeId?: string,
): Promise<AuditEvent[]> {
  const filtered = challengeId
    ? auditTrailStorage.filter((event) => event.challengeId === challengeId)
    : auditTrailStorage;

  return [...filtered].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Resets storage for unit tests only.
 */
export function _clearAuditTrailForTests(): void {
  auditTrailStorage.length = 0;
}
