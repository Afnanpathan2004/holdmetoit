"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Coffee, ArrowLeft } from "lucide-react";

import type { ScoreboardViewModel } from "@/features/leaderboard/data/scoreboard.repository";
import { MatchScoreboardBanner } from "./match-scoreboard-banner";
import { TeamFilterTabs } from "./team-filter-tabs";
import { StandingsTable } from "./standings-table";
import { PunishmentNook } from "./punishment-nook";

interface ChallengeScoreboardViewProps {
  initialData: ScoreboardViewModel;
  isAuthenticated?: boolean;
}

export function ChallengeScoreboardView({
  initialData,
  isAuthenticated = false,
}: ChallengeScoreboardViewProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | "all">("all");

  const filteredParticipants = useMemo(() => {
    if (selectedTeamId === "all") {
      return initialData.participants;
    }
    return initialData.participants.filter((p) => p.teamId === selectedTeamId);
  }, [initialData.participants, selectedTeamId]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Spectator Navigation Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-cafe-border bg-cafe-card text-cafe-honey">
            <Coffee className="size-5" />
          </div>
          <div>
            <Link
              href="/"
              className="font-serif text-lg font-bold tracking-tight text-cafe-parchment hover:text-cafe-honey-light transition-colors"
            >
              HoldMeToIt
            </Link>
            <p className="text-xs text-cafe-oatmeal">Cozy Study Accountability</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cafe-border bg-cafe-card px-3 py-1 text-xs font-medium text-cafe-oatmeal">
            <Eye className="size-3.5 text-cafe-honey" />
            <span>Public Spectator Mode</span>
          </div>

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-cafe-border bg-cafe-wood px-4 py-2 text-sm font-medium text-cafe-parchment hover:bg-cafe-elevated transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Cockpit</span>
            </Link>
          ) : (
            <Link
              href="/api/auth/signin"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-cafe-honey px-4 py-2 text-sm font-medium text-cafe-bg shadow hover:bg-cafe-honey-light transition-colors"
            >
              Login with Discord
            </Link>
          )}
        </div>
      </header>

      {/* Head-to-Head Top Banner */}
      <MatchScoreboardBanner
        challengeTitle={initialData.challenge.title}
        challengeStatus={initialData.challenge.status}
        startAt={initialData.challenge.startAt}
        endAt={initialData.challenge.endAt}
        teams={initialData.teams}
        leadMargin={initialData.leadMargin}
      />

      {/* Roster & Standings Section */}
      <section className="space-y-4" aria-label="Standings and Rosters">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-cafe-parchment">
              Standings & House Rosters
            </h2>
            <p className="text-xs text-cafe-oatmeal">
              Pure second-level precision with deterministic competition ranking.
            </p>
          </div>

          {/* Team Filter Tabs */}
          <TeamFilterTabs
            teams={initialData.teams}
            selectedTeamId={selectedTeamId}
            onSelectTeam={setSelectedTeamId}
            totalParticipantsCount={initialData.participants.length}
          />
        </div>

        {/* Unified Standings Table */}
        <StandingsTable participants={filteredParticipants} />
      </section>

      {/* Accountability Nook & Forfeits Corner (COMPLETED challenges) */}
      <PunishmentNook
        challengeStatus={initialData.challenge.status}
        punishedParticipants={initialData.punishedParticipants}
        punishmentPfpUrl={initialData.challenge.punishmentPfpUrl}
      />
    </div>
  );
}

