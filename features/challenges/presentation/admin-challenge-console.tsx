"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Flame,
  History,
  ListTodo,
  Lock,
  Play,
  Share2,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  kickoffChallengeAction,
  lockChallengeResultsAction,
} from "@/features/challenges/api/challenge-admin.actions";
import {
  AdminRosterGrid,
  type AdminRosterParticipant,
} from "@/features/challenges/presentation/admin-roster-grid";
import {
  AdminGoalsPardons,
  type ParticipantWithGoalsAndPunishment,
} from "@/features/challenges/presentation/admin-goals-pardons";
import { DiscordSummaryCard } from "@/features/notifications/presentation/discord-summary-card";
import { AuditTrailTable } from "@/features/audit/presentation/audit-trail-table";
import type { AuditEvent } from "@/features/audit/domain/audit-log";
import type { DiscordSummaryInput } from "@/features/notifications/domain/discord-summary";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";

export interface AdminChallengeViewModel {
  id: string;
  title: string;
  format: "TEAM_VS_TEAM" | "DUOS" | "SOLOS";
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  startAt: string;
  endAt: string;
  punishmentPfpUrl: string | null;
  host: {
    displayName: string | null;
    username: string | null;
  } | null;
  teams: Array<{
    id: string;
    name: string;
    color: string | null;
    iconEmoji: string | null;
    participantCount: number;
    totalLoggedSeconds: number;
  }>;
  roster: AdminRosterParticipant[];
  goalsAndPardons: ParticipantWithGoalsAndPunishment[];
  auditTrail: AuditEvent[];
  discordSummary: DiscordSummaryInput;
}

interface AdminChallengeConsoleProps {
  initialData: AdminChallengeViewModel;
}

export function AdminChallengeConsole({
  initialData,
}: AdminChallengeConsoleProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "roster" | "goals" | "audit"
  >("overview");

  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleKickoff = () => {
    if (
      !window.confirm(
        "Are you ready to start this event? This will transition status to ACTIVE and permanently lock declared hours and goals for all participants (Law L6).",
      )
    ) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const res = await kickoffChallengeAction(initialData.id);
      if (!res.ok) {
        setActionError(res.message);
      }
    });
  };

  const handleLockResults = () => {
    if (
      !window.confirm(
        "Lock final results? This will evaluate all participants with the dual-failure engine (Law L6), assign PUNISHED status to failed members, and freeze all logs.",
      )
    ) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const res = await lockChallengeResultsAction(initialData.id);
      if (!res.ok) {
        setActionError(res.message);
      }
    });
  };

  const totalEventLoggedSeconds = initialData.teams.reduce(
    (sum, t) => sum + t.totalLoggedSeconds,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border border-cafe-border bg-cafe-bg text-cafe-honey">
                <Shield className="h-3.5 w-3.5" />
                <span>Host Control Console</span>
              </span>

              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border ${
                  initialData.status === "ACTIVE"
                    ? "border-cafe-honey/40 bg-cafe-honey/15 text-cafe-honey"
                    : initialData.status === "COMPLETED"
                      ? "border-cafe-sage/40 bg-cafe-sage/15 text-cafe-sage"
                      : "border-cafe-border bg-cafe-elevated text-cafe-linen"
                }`}
              >
                {initialData.status}
              </span>

              <span className="text-xs text-cafe-ash font-mono">
                {initialData.format}
              </span>
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-bold text-cafe-parchment tracking-tight">
              {initialData.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-cafe-oatmeal">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-cafe-honey" />
                <span>
                  {new Date(initialData.startAt).toLocaleDateString()} —{" "}
                  {new Date(initialData.endAt).toLocaleDateString()}
                </span>
              </span>
              <span>•</span>
              <span>
                Host:{" "}
                <strong className="text-cafe-linen">
                  {initialData.host?.displayName ||
                    initialData.host?.username ||
                    "Community Moderator"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Total Logged:{" "}
                <strong className="font-mono text-cafe-honey">
                  {formatSecondsToClock(totalEventLoggedSeconds)}
                </strong>
              </span>
            </div>
          </div>

          {/* Quick Actions & Status Triggers */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/challenge/${initialData.id}`}
              className="inline-flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-cafe-border bg-cafe-bg px-4 text-xs font-medium text-cafe-linen hover:bg-cafe-wood transition-colors"
            >
              <span>View Public Scoreboard</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            {initialData.status === "UPCOMING" && (
              <Button
                onClick={handleKickoff}
                disabled={isPending}
                className="h-11 min-h-[44px] gap-2 font-semibold bg-cafe-honey text-cafe-bg hover:bg-cafe-honey-light shadow-cafe"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Event Now (FEAT-CHAL-02)</span>
              </Button>
            )}

            {initialData.status === "ACTIVE" && (
              <Button
                onClick={handleLockResults}
                disabled={isPending}
                className="h-11 min-h-[44px] gap-2 font-semibold bg-cafe-terracotta text-cafe-parchment hover:bg-cafe-terracotta/90 shadow-cafe"
              >
                <Lock className="h-4 w-4" />
                <span>Lock Final Results (FEAT-CHAL-05)</span>
              </Button>
            )}

            {initialData.status === "COMPLETED" && (
              <div className="flex items-center gap-1.5 rounded-xl border border-cafe-sage/40 bg-cafe-sage/15 px-3 py-2 text-xs font-semibold text-cafe-sage">
                <CheckCircle className="h-4 w-4" />
                <span>Results Finalized & Locked</span>
              </div>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mt-4 rounded-xl border border-cafe-terracotta/40 bg-cafe-terracotta/10 p-3 text-xs text-cafe-parchment">
            {actionError}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-cafe-border/60 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-cafe-honey text-cafe-bg font-semibold shadow"
                : "bg-cafe-card text-cafe-linen hover:bg-cafe-elevated"
            }`}
          >
            Overview & Broadcaster
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("roster")}
            className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "roster"
                ? "bg-cafe-honey text-cafe-bg font-semibold shadow"
                : "bg-cafe-card text-cafe-linen hover:bg-cafe-elevated"
            }`}
          >
            Roster & Hours Override ({initialData.roster.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("goals")}
            className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "goals"
                ? "bg-cafe-honey text-cafe-bg font-semibold shadow"
                : "bg-cafe-card text-cafe-linen hover:bg-cafe-elevated"
            }`}
          >
            Goals & Pardons ({initialData.goalsAndPardons.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "audit"
                ? "bg-cafe-honey text-cafe-bg font-semibold shadow"
                : "bg-cafe-card text-cafe-linen hover:bg-cafe-elevated"
            }`}
          >
            Audit Trail ({initialData.auditTrail.length})
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Broadcaster */}
          <DiscordSummaryCard data={initialData.discordSummary} />

          {/* Teams Overview Grid */}
          <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
            <h3 className="font-serif text-lg font-semibold text-cafe-parchment mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-cafe-honey" />
              <span>Competing Houses & Cumulative Standings</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialData.teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-xl border border-cafe-border/80 bg-cafe-bg/60 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{team.iconEmoji || "🛡️"}</span>
                    <div>
                      <h4 className="font-medium text-sm text-cafe-parchment">
                        {team.name}
                      </h4>
                      <p className="text-xs text-cafe-oatmeal">
                        {team.participantCount} participant(s) enrolled
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-cafe-honey">
                      {formatSecondsToClock(team.totalLoggedSeconds)}
                    </div>
                    <span className="text-[10px] text-cafe-ash uppercase tracking-wider">
                      Cumulative Hours
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "roster" && (
        <AdminRosterGrid
          challengeId={initialData.id}
          participants={initialData.roster}
        />
      )}

      {activeTab === "goals" && (
        <AdminGoalsPardons
          challengeId={initialData.id}
          participants={initialData.goalsAndPardons}
        />
      )}

      {activeTab === "audit" && (
        <AuditTrailTable
          events={initialData.auditTrail}
          challengeTitle={initialData.title}
        />
      )}
    </div>
  );
}
