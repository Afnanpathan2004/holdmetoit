import Link from "next/link";
import {
  Calendar,
  Users,
  Trophy,
  PlusCircle,
  ExternalLink,
  Clock,
  History,
  ShieldAlert,
} from "lucide-react";

import { EmptyState } from "@/components/state/empty-state";
import { Button } from "@/components/ui/button";
import { requireAdminOrHost } from "@/features/auth/api/require-admin";
import { findAllChallenges } from "@/features/challenges/data/admin-challenge.repository";
import { getRecentAuditLogs } from "@/features/audit/data/audit.repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminOrHost();

  const [challenges, auditLogs] = await Promise.all([
    findAllChallenges(),
    getRecentAuditLogs(10),
  ]);

  const activeCount = challenges.filter((c) => c.status === "ACTIVE").length;
  const upcomingCount = challenges.filter((c) => c.status === "UPCOMING").length;
  const completedCount = challenges.filter((c) => c.status === "COMPLETED").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Welcome & Metrics Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-cafe-oatmeal">
            Host Dashboard
          </span>
          <h1 className="font-serif text-2xl font-semibold text-cafe-parchment sm:text-3xl">
            Challenge Management & Event Hub
          </h1>
          <p className="mt-1 text-xs text-cafe-oatmeal sm:text-sm">
            Configure battles, manage rosters, override study hours, and monitor audit events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="min-h-[44px]">
            <Link href="/admin/challenges/new">
              <PlusCircle className="size-4" />
              <span>New Challenge</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Snapshot Counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-cafe-border bg-cafe-card p-4">
          <p className="text-xs text-cafe-oatmeal">Total Battles</p>
          <p className="mt-1 font-mono text-2xl font-bold text-cafe-parchment">
            {challenges.length}
          </p>
        </div>

        <div className="rounded-2xl border border-cafe-sage/40 bg-cafe-sage-surface p-4">
          <p className="text-xs text-cafe-parchment/80">Active Sprints</p>
          <p className="mt-1 font-mono text-2xl font-bold text-cafe-parchment">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-cafe-border bg-cafe-card p-4">
          <p className="text-xs text-cafe-oatmeal">Upcoming Kickoffs</p>
          <p className="mt-1 font-mono text-2xl font-bold text-cafe-honey-light">
            {upcomingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-cafe-border bg-cafe-card p-4">
          <p className="text-xs text-cafe-oatmeal">Completed Events</p>
          <p className="mt-1 font-mono text-2xl font-bold text-cafe-oatmeal">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Challenge List Section */}
      <section className="space-y-4" aria-label="Existing Challenges">
        <h2 className="font-serif text-xl font-semibold text-cafe-parchment">
          All Challenges
        </h2>

        {challenges.length === 0 ? (
          <EmptyState
            title="No challenges configured"
            description="Create your first study battle to configure teams, enroll participants, and kick off tracking."
            action={
              <Button asChild className="min-h-[44px]">
                <Link href="/admin/challenges/new">
                  <PlusCircle className="size-4" />
                  <span>Create First Challenge</span>
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {challenges.map((c) => {
              const statusBadgeClass =
                c.status === "ACTIVE"
                  ? "border-cafe-sage/40 bg-cafe-sage-surface text-cafe-parchment"
                  : c.status === "UPCOMING"
                  ? "border-cafe-border bg-cafe-wood text-cafe-honey-light"
                  : "border-cafe-border bg-cafe-wood text-cafe-oatmeal";

              return (
                <div
                  key={c.id}
                  className="flex flex-col justify-between rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe transition-colors hover:border-cafe-borderLight"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass}`}
                      >
                        {c.status}
                      </span>
                      <span className="rounded-lg border border-cafe-border bg-cafe-wood px-2 py-0.5 text-xs text-cafe-linen">
                        {c.format}
                      </span>
                    </div>

                    <h3 className="mt-3 font-serif text-xl font-bold text-cafe-parchment">
                      {c.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-cafe-oatmeal">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        {new Date(c.startAt).toLocaleDateString()} –{" "}
                        {new Date(c.endAt).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        {c._count.participants} enrolled
                      </span>
                    </div>

                    {/* Teams Preview */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {c.teams.map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 rounded-md border border-cafe-border bg-cafe-wood px-2 py-1 text-xs text-cafe-linen"
                        >
                          <span>{t.iconEmoji ?? "🛡️"}</span>
                          <span>{t.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-cafe-border pt-4">
                    <Link
                      href={`/admin/challenges/${c.id}`}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-cafe-wood px-3.5 py-2 text-xs font-medium text-cafe-parchment hover:bg-cafe-elevated transition-colors"
                    >
                      <span>Manage Event</span>
                    </Link>

                    <Link
                      href={`/admin/challenges/${c.id}/roster`}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-cafe-border bg-transparent px-3.5 py-2 text-xs font-medium text-cafe-linen hover:bg-cafe-wood transition-colors"
                    >
                      <Clock className="size-3.5" />
                      <span>Hours Override</span>
                    </Link>

                    <Link
                      href={`/challenge/${c.id}`}
                      target="_blank"
                      className="ml-auto inline-flex min-h-[40px] items-center gap-1 text-xs text-cafe-oatmeal hover:text-cafe-honey-light transition-colors"
                    >
                      <span>Public View</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* System Audit Trail (FEAT-AUDIT-01) */}
      <section className="space-y-4 rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
        <div className="flex items-center justify-between border-b border-cafe-border pb-4">
          <div className="flex items-center gap-2">
            <History className="size-5 text-cafe-honey" />
            <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
              Recent System Audit Trail (FEAT-AUDIT-01)
            </h2>
          </div>
          <span className="text-xs text-cafe-oatmeal">Append-Only Immutability</span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-sm text-cafe-oatmeal">No audit events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="System Audit Trail">
              <thead className="border-b border-cafe-border text-cafe-oatmeal uppercase">
                <tr>
                  <th scope="col" className="pb-3 pr-4">Timestamp</th>
                  <th scope="col" className="pb-3 pr-4">Actor</th>
                  <th scope="col" className="pb-3 pr-4">Action</th>
                  <th scope="col" className="pb-3 pr-4">Target Entity</th>
                  <th scope="col" className="pb-3">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border text-cafe-linen">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-cafe-wood/40">
                    <td className="whitespace-nowrap py-3 pr-4 font-mono text-[11px] text-cafe-oatmeal">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 font-medium text-cafe-parchment">
                      {log.actorUsername}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      <span className="rounded bg-cafe-wood px-2 py-0.5 font-mono text-[10px] text-cafe-honey-light">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-cafe-oatmeal">
                      {log.targetEntityType}
                    </td>
                    <td className="py-3 text-cafe-parchment">
                      {log.auditReason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

