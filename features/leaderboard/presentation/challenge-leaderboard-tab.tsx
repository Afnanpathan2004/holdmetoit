"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Clock, Trophy, Crown, Flame, Medal } from "lucide-react";
import { Input } from "@/components/ui/input";
import type {
  ChallengeScoreboardViewModel,
  ScoreboardStandingEntry,
} from "../data/leaderboard-data";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";

interface ChallengeLeaderboardTabProps {
  challenge: ChallengeScoreboardViewModel;
}

export function ChallengeLeaderboardTab({ challenge }: ChallengeLeaderboardTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { matchHeader, teams, standings } = challenge;

  const teamA = matchHeader.teamA ?? teams[0];
  const teamB = matchHeader.teamB ?? teams[1];

  const filteredStandings = standings.filter((entry) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      entry.displayName.toLowerCase().includes(q) ||
      (entry.username && entry.username.toLowerCase().includes(q)) ||
      entry.teamName.toLowerCase().includes(q)
    );
  });

  const totalSecondsCombined =
    (teamA?.totalLoggedSeconds ?? 0) + (teamB?.totalLoggedSeconds ?? 0);
  const totalHoursCombined = Math.round(totalSecondsCombined / 3600);

  const ratioA = matchHeader.ratioPercentageA ?? 0;
  const ratioB = matchHeader.ratioPercentageB ?? 0;

  // Average per person
  const avgHoursA = teamA && teamA.companionCount > 0
    ? Math.round(teamA.totalLoggedSeconds / 3600 / teamA.companionCount)
    : 0;
  const avgHoursB = teamB && teamB.companionCount > 0
    ? Math.round(teamB.totalLoggedSeconds / 3600 / teamB.companionCount)
    : 0;

  // Top 3 Podium
  const top1 = standings[0];
  const top2 = standings[1];
  const top3 = standings[2];

  return (
    <div className="space-y-8">
      {/* 1. Head-to-Head Battle Progress Matchup (Leaderboard 142:2183) */}
      {teamA && teamB ? (
        <div className="rounded-3xl border border-[#262626] bg-[#141414] p-5 sm:p-7 shadow-lg space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Team A / Serpents Card */}
            <div className="md:col-span-5 rounded-2xl border border-[#22c55e]/50 bg-[#144520]/20 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#ffffff] flex items-center gap-2">
                    {teamA.iconEmoji && <span>{teamA.iconEmoji}</span>}
                    {teamA.name}
                  </h3>
                  <p className="text-xs text-[#d1d1d1] mt-0.5">
                    {teamA.companionCount} Participants
                  </p>
                </div>
                <span className="text-xs text-[#868686]">
                  Weekly Target: {teamA.targetHours}h
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#ffffff] font-sans font-sans-tabular">
                    {teamA.totalLoggedClock}
                  </span>
                  <span className="text-xs text-[#bcbcbc]">
                    ~{avgHoursA} hrs / Person
                  </span>
                </div>
                <p className="text-[11px] text-[#868686] mt-0.5">Total hours logged</p>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#1c1c1c]">
                <div
                  className="h-full rounded-full bg-[#22c55e] transition-all duration-500"
                  style={{ width: `${teamA.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Circular VS Badge */}
            <div className="md:col-span-1 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border border-[#434343] bg-[#292929] flex items-center justify-center font-bold text-sm text-[#ffffff] shadow-md">
                VS
              </div>
            </div>

            {/* Team B / Raven Card */}
            <div className="md:col-span-5 rounded-2xl border border-[#3b82f6]/50 bg-[#102d40]/20 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#ffffff] flex items-center gap-2">
                    {teamB.iconEmoji && <span>{teamB.iconEmoji}</span>}
                    {teamB.name}
                  </h3>
                  <p className="text-xs text-[#d1d1d1] mt-0.5">
                    {teamB.companionCount} Participants
                  </p>
                </div>
                <span className="text-xs text-[#868686]">
                  Weekly Target: {teamB.targetHours}h
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#ffffff] font-sans font-sans-tabular">
                    {teamB.totalLoggedClock}
                  </span>
                  <span className="text-xs text-[#bcbcbc]">
                    ~{avgHoursB} hrs / Person
                  </span>
                </div>
                <p className="text-[11px] text-[#868686] mt-0.5">Total hours logged</p>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#1c1c1c]">
                <div
                  className="h-full rounded-full bg-[#3b82f6] transition-all duration-500"
                  style={{ width: `${teamB.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tug-of-War Split Share Bar */}
          <div className="pt-2 space-y-2 border-t border-[#262626]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#ffffff]">
              <span className="text-[#22c55e]">Share: {ratioA}%</span>
              <span className="text-xs text-[#d1d1d1] font-normal">
                Total Challenge Log: {totalHoursCombined} hours
              </span>
              <span className="text-[#3b82f6]">Share: {ratioB}%</span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-[#1c1c1c] flex">
              <div
                className="h-full bg-[#22c55e] transition-all duration-500"
                style={{ width: `${ratioA}%` }}
              />
              <div
                className="h-full bg-[#3b82f6] transition-all duration-500"
                style={{ width: `${ratioB}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Top 3 Highlight / Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Rank 2 */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-4 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-[#292929] border border-[#434343] flex items-center justify-center font-bold text-sm text-[#bcbcbc]">
            2
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#868686]">Runner-up</p>
            <p className="text-sm font-bold text-[#ffffff] truncate">
              {top2 ? top2.displayName : "Awaiting..."}
            </p>
            <p className="text-xs font-sans font-sans-tabular text-[#d1d1d1] mt-0.5">
              {top2 ? top2.totalLoggedClock : "00:00:00"}
            </p>
          </div>
        </div>

        {/* Rank 1 (MVP) */}
        <div className="rounded-2xl border border-[#22c55e]/50 bg-[#144520]/25 p-4 flex items-center gap-3.5 shadow-md">
          <div className="h-10 w-10 rounded-xl bg-[#22c55e] text-[#0d0d0d] flex items-center justify-center font-bold text-sm">
            <Crown className="h-5 w-5 fill-current" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#85ff93] font-semibold flex items-center gap-1">
              Top Contributor · Rank 1
            </p>
            <p className="text-sm font-bold text-[#ffffff] truncate">
              {top1 ? top1.displayName : "Awaiting..."}
            </p>
            <p className="text-xs font-sans font-sans-tabular text-[#85ff93] mt-0.5">
              {top1 ? top1.totalLoggedClock : "00:00:00"}
            </p>
          </div>
        </div>

        {/* Rank 3 */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-4 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-[#292929] border border-[#434343] flex items-center justify-center font-bold text-sm text-[#cd7f32]">
            3
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#868686]">Rank 3</p>
            <p className="text-sm font-bold text-[#ffffff] truncate">
              {top3 ? top3.displayName : "Awaiting..."}
            </p>
            <p className="text-xs font-sans font-sans-tabular text-[#d1d1d1] mt-0.5">
              {top3 ? top3.totalLoggedClock : "00:00:00"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Standings Table & Search Bar (Leaderboard Column 61:1571 & Search Bar 61:1543) */}
      <div className="rounded-3xl border border-[#262626] bg-[#141414] p-5 sm:p-7 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#262626]">
          <h3 className="text-xl font-bold text-[#ffffff]">Leaderboard Standings</h3>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#868686]" />
            <Input
              type="text"
              placeholder="Search scholar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 bg-[#1c1c1c] border-[#333333] text-[#ffffff] placeholder-[#868686] text-xs rounded-full"
            />
          </div>
        </div>

        {filteredStandings.length === 0 ? (
          <p className="text-center py-8 text-xs text-[#868686]">
            No scholars match your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#292929] text-[11px] font-medium text-[#868686] uppercase tracking-wider">
                  <th className="px-3 py-3 w-12 text-center">Rank</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Today&apos;s hours</th>
                  <th className="px-4 py-3 text-right">Total hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredStandings.map((entry) => {
                  const isTeamA = teamA && entry.teamName === teamA.name;
                  const rowTintClass = isTeamA
                    ? "bg-[#144520]/15 hover:bg-[#144520]/25"
                    : "bg-[#102d40]/15 hover:bg-[#102d40]/25";

                  return (
                    <tr
                      key={entry.participantId}
                      className={`transition-colors group ${rowTintClass}`}
                    >
                      {/* Rank */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1c1c1c] text-xs font-bold text-[#ffffff] border border-[#333333]">
                          {entry.rank}
                        </span>
                      </td>

                      {/* Name & Avatar */}
                      <td className="px-4 py-3 font-medium text-[#ffffff]">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-[#292929] border border-[#434343] overflow-hidden flex items-center justify-center text-xs shrink-0">
                            {entry.image ? (
                              <Image
                                src={entry.image}
                                alt={entry.displayName}
                                width={28}
                                height={28}
                                className="object-cover"
                              />
                            ) : (
                              <span>{entry.displayName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[#ffffff]">{entry.displayName}</p>
                            {entry.username && (
                              <p className="text-[10px] text-[#868686]">@{entry.username}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            isTeamA
                              ? "bg-[#144520] border-[#22c55e]/40 text-[#85ff93]"
                              : "bg-[#102d40] border-[#3b82f6]/40 text-[#85d6ff]"
                          }`}
                        >
                          {entry.teamName}
                        </span>
                      </td>

                      {/* Today's Hours */}
                      <td className="px-4 py-3 font-sans font-sans-tabular text-xs text-[#d1d1d1]">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#868686]" />
                          {/* Display today or target */}
                          <span>{entry.totalLoggedClock}</span>
                        </span>
                      </td>

                      {/* Total Hours */}
                      <td className="px-4 py-3 text-right font-sans font-sans-tabular text-sm font-bold text-[#ffffff]">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Clock className="h-3.5 w-3.5 text-[#22c55e]" />
                          <span>{entry.totalLoggedClock}</span>
                          <span className="text-xs text-[#868686] font-normal">
                            / {entry.targetClock}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
