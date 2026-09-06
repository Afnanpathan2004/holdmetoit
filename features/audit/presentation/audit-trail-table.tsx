"use client";

import { useState } from "react";
import { Download, FileText, History, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  exportAuditTrailToJson,
  formatAuditActionHuman,
  type AuditEvent,
} from "@/features/audit/domain/audit-log";

interface AuditTrailTableProps {
  events: AuditEvent[];
  challengeTitle?: string;
}

export function AuditTrailTable({
  events,
  challengeTitle = "HoldMeToIt",
}: AuditTrailTableProps) {
  const [downloading, setDownloading] = useState(false);

  const handleExportJson = () => {
    setDownloading(true);
    try {
      const jsonContent = exportAuditTrailToJson(events);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-trail-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-cafe-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/15 text-cafe-honey">
              <History className="h-4 w-4" />
            </span>
            <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
              Append-Only System Audit Trail
            </h3>
          </div>
          <p className="mt-1 text-xs text-cafe-oatmeal">
            Immutable log of all administrative hours adjustments, goal edits, pardons, and status changes (FEAT-AUDIT-01).
          </p>
        </div>

        <Button
          onClick={handleExportJson}
          disabled={events.length === 0 || downloading}
          variant="secondary"
          className="h-10 min-h-[44px] gap-2 text-xs"
        >
          <Download className="h-4 w-4 text-cafe-honey" />
          <span>Export Audit Log (JSON)</span>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-cafe-ash" />
          <p className="mt-2 text-sm font-medium text-cafe-linen">
            No administrative events recorded yet
          </p>
          <p className="text-xs text-cafe-oatmeal mt-1">
            Actions like hours overrides, kickoffs, goal edits, and pardons will be permanently logged here.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-cafe-linen">
            <thead className="border-b border-cafe-border bg-cafe-bg/60 text-cafe-ash font-medium uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action & Target</th>
                <th className="py-3 px-4">Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-border/50">
              {events.map((event) => {
                const formattedDate = new Date(event.timestamp)
                  .toISOString()
                  .replace("T", " ")
                  .substring(0, 19);

                return (
                  <tr
                    key={event.id}
                    className="hover:bg-cafe-wood/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-cafe-ash whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-cafe-parchment">
                        {event.actorUsername}
                      </div>
                      <div className="font-mono text-[10px] text-cafe-ash truncate max-w-[120px]">
                        {event.actorId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 font-medium text-[11px] bg-cafe-elevated text-cafe-honey border border-cafe-border">
                        {formatAuditActionHuman(event.actionType)}
                      </span>
                      <div className="mt-1 font-mono text-[11px] text-cafe-oatmeal truncate max-w-[200px]">
                        Target: {event.targetEntityType} ({event.targetEntityId})
                      </div>
                    </td>
                    <td className="py-3 px-4 font-serif italic text-cafe-linen max-w-[240px]">
                      {event.auditReason ? (
                        `"${event.auditReason}"`
                      ) : (
                        <span className="text-cafe-ash not-italic">System action</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
