"use server";

import { auth } from "@/core/auth";
import { hasAdminPrivileges } from "@/features/auth/domain/auth-roles";
import { getAuditTrail } from "@/features/audit/data/audit-log.repository";
import type { AuditEvent } from "@/features/audit/domain/audit-log";

export async function getChallengeAuditTrailAction(
   challengeId: string
): Promise<{ ok: boolean; message?: string; logs: AuditEvent[] }> {
   try {
      const session = await auth();
      if (!session?.user || !hasAdminPrivileges(session.user.role)) {
         return {
            ok: false,
            message:
               "Unauthorized: Administrator privileges required to inspect event audit trail.",
            logs: [],
         };
      }

      if (!challengeId?.trim()) {
         return { ok: false, message: "Challenge ID is required.", logs: [] };
      }

      const logs = await getAuditTrail(challengeId.trim());
      return { ok: true, logs };
   } catch (error) {
      console.error("Failed to retrieve challenge audit trail:", error);
      return {
         ok: false,
         message: "An unexpected error occurred while fetching audit records.",
         logs: [],
      };
   }
}
