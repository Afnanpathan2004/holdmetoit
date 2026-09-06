"use client";

import Image from "next/image";
import { useState } from "react";

import type {
  ParticipantPaceStatus,
  ScoreboardStandingEntry,
  ScoreboardTeam,
} from "../data/leaderboard-data";

interface StandingsTableProps {
  standings: ScoreboardStandingEntry[];
  teams: ScoreboardTeam[];
}

export function StandingsTable({ standings, teams }: StandingsTableProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");

  const filteredStandings =
    selectedTeamId === "all"
      ? standings
      : standings.filter((entry) => entry.teamId === selectedTeamId);

  return (
    <div className="space-y-4 rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-7">
      {/* Noticeboard Header with Team Tabs */}
      <div className="flex flex-col gap-3 pb-3 border-b border-cafe-border sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📋</span>
          <div>
            <h3 className="font-serif text-base font-semibold text-cafe-parchment">
              Study Lounge Standings
            </h3>
            <p className="text-[11px] text-cafe-oatmeal">
              All companions ordered by verified study time
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedTeamId("all")}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 font-medium transition-all ${
              selectedTeamId === "all"
                ? "border border-cafe-border bg-cafe-elevated text-cafe-honey shadow-sm"
                : "text-cafe-oatmeal hover:text-cafe-parchment"
            }`}
          >
            All
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeamId(team.id)}
              className={`min-h-[36px] rounded-lg px-3 py-1.5 font-medium transition-all ${
                selectedTeamId === team.id
                  ? "border border-cafe-border bg-cafe-elevated text-cafe-honey shadow-sm"
                  : "text-cafe-oatmeal hover:text-cafe-parchment"
              }`}
            >
              {team.iconEmoji ? `${team.iconEmoji} ` : ""}
              {team.name}
            </button>
          ))}
        </div>
      </div>

      {filteredStandings.length === 0 ? (
        <div className="py-8 text-center text-xs text-cafe-oatmeal">
          No companions found in this house view.
        </div>
      ) : (
        <>
          {/* Desktop Table View (>768px) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cafe-border/50 font-mono text-[10px] uppercase tracking-wider text-cafe-ash">
                  <th className="px-3 py-2.5 font-normal">#</th>
                  <th className="px-3 py-2.5 font-normal">Participant</th>
                  <th className="px-3 py-2.5 font-normal">House</th>
                  <th className="px-3 py-2.5 font-normal">Logged</th>
                  <th className="px-3 py-2.5 font-normal">Target</th>
                  <th className="px-3 py-2.5 font-normal">Goals</th>
                  <th className="px-3 py-2.5 text-right font-normal">Pace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border/30 font-mono-tabular">
                {filteredStandings.map((entry) => (
                  <tr
                    key={entry.participantId}
                    className="group transition-colors hover:bg-cafe-elevated/40"
                  >
                    {/* Rank with Podium Styling */}
                    <td className="px-3 py-3 font-semibold">
                      <PodiumRank rank={entry.rank} />
                    </td>

                    {/* Participant Avatar & Name */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cafe-border bg-cafe-elevated">
                          {entry.image ? (
                            <Image
                              src={entry.image}
                              alt={entry.displayName}
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="font-serif text-xs font-bold text-cafe-honey-light">
                              {entry.displayName.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="font-sans">
                          <span className="block text-xs font-medium text-cafe-parchment">
                            {entry.displayName}
                          </span>
                          {entry.username && (
                            <span className="block font-mono text-[10px] text-cafe-ash">
                              @{entry.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* House Badge */}
                    <td className="px-3 py-3 font-sans">
                      <span className="inline-flex items-center gap-1 rounded-md border border-cafe-border bg-cafe-bg/60 px-2 py-0.5 text-[11px] text-cafe-linen">
                        {entry.teamIcon && <span>{entry.teamIcon}</span>}
                        <span>{entry.teamName}</span>
                      </span>
                    </td>

                    {/* Total Logged */}
                    <td className="px-3 py-3 font-semibold text-cafe-honey-light">
                      {entry.totalLoggedClock}
                    </td>

                    {/* Target Clock */}
                    <td className="px-3 py-3 text-cafe-oatmeal">
                      {entry.targetClock}
                    </td>

                    {/* Goals Ratio */}
                    <td className="px-3 py-3 font-sans text-[11px] text-cafe-linen">
                      <span className="font-mono text-cafe-parchment font-medium">
                        {entry.goalsCompletedCount}/{entry.goalsTotalCount}
                      </span>
                      {entry.goalsTotalCount > 0 &&
                        entry.goalsCompletedCount === entry.goalsTotalCount && (
                          <span className="ml-1 text-cafe-sage">✓</span>
                        )}
                    </td>

                    {/* Pace Badge */}
                    <td className="px-3 py-3 text-right">
                      <PaceStatusBadge
                        status={entry.paceStatus}
                        label={entry.paceLabel}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (<768px down to 360px per DESIGN.md §5) */}
          <div className="space-y-3 md:hidden">
            {filteredStandings.map((entry) => (
              <div
                key={entry.participantId}
                className="space-y-2.5 rounded-2xl border border-cafe-border bg-cafe-elevated/40 p-3.5 shadow-sm"
              >
                {/* Header: Rank + Avatar + Name + House */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PodiumRank rank={entry.rank} />
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cafe-border bg-cafe-elevated">
                      {entry.image ? (
                        <Image
                          src={entry.image}
                          alt={entry.displayName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-serif text-xs font-bold text-cafe-honey-light">
                          {entry.displayName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-cafe-parchment">
                        {entry.displayName}
                      </span>
                      <span className="block text-[10px] text-cafe-ash font-sans">
                        {entry.teamIcon ? `${entry.teamIcon} ` : ""}
                        {entry.teamName}
                      </span>
                    </div>
                  </div>

                  <PaceStatusBadge
                    status={entry.paceStatus}
                    label={entry.paceLabel}
                  />
                </div>

                {/* Stats row: Logged vs Target, Goals */}
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-cafe-border/50 bg-cafe-bg/60 p-2.5 text-xs font-mono-tabular">
                  <div>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-cafe-ash">
                      Logged / Target
                    </span>
                    <span className="font-semibold text-cafe-honey-light">
                      {entry.totalLoggedClock}
                    </span>
                    <span className="text-cafe-ash"> / {entry.targetClock}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-cafe-ash">
                      Goals Done
                    </span>
                    <span className="font-sans text-xs text-cafe-parchment">
                      {entry.goalsCompletedCount} of {entry.goalsTotalCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PodiumRank({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1 font-serif text-sm font-semibold text-cafe-honey">
        <span>🥇</span>
        <span className="hidden sm:inline">1st</span>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1 font-serif text-sm font-semibold text-cafe-linen">
        <span>🥈</span>
        <span className="hidden sm:inline">2nd</span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1 font-serif text-sm font-semibold text-cafe-oatmeal">
        <span>🥉</span>
        <span className="hidden sm:inline">3rd</span>
      </span>
    );
  }

  return (
    <span className="font-mono text-xs font-medium text-cafe-ash">
      #{rank}
    </span>
  );
}

function PaceStatusBadge({
  status,
  label,
}: {
  status: ParticipantPaceStatus;
  label: string;
}) {
  if (status === "serene" || status === "on-track") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-cafe-sage/30 bg-cafe-sage-surface px-2 py-0.5 text-[10px] font-medium text-cafe-sage">
        <span className="h-1.5 w-1.5 rounded-full bg-cafe-sage" />
        {label}
      </span>
    );
  }

  if (status === "catch-up" || status === "punished") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-cafe-cinnamon/30 bg-cafe-cinnamon-surface px-2 py-0.5 text-[10px] font-medium text-cafe-cinnamon">
        <span className="h-1.5 w-1.5 rounded-full bg-cafe-cinnamon" />
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-cafe-lavender/30 bg-cafe-lavender-surface px-2 py-0.5 text-[10px] font-medium text-cafe-lavender">
      {label}
    </span>
  );
}
