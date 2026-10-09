"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Clock, Crown, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import type {
  ChallengeScoreboardViewModel,
  ScoreboardStandingEntry,
} from "../data/leaderboard-data";
import {
  AdminHoursOverrideModal,
  type AdminHoursOverrideParticipant,
} from "@/features/study-logs/presentation/admin-hours-override-modal";
import { DataPagination } from "@/components/ui/data-pagination";

interface ChallengeLeaderboardTabProps {
  challenge: ChallengeScoreboardViewModel;
  isAdmin?: boolean;
}

export function ChallengeLeaderboardTab({
  challenge,
  isAdmin = false,
}: ChallengeLeaderboardTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [overrideParticipant, setOverrideParticipant] =
    useState<AdminHoursOverrideParticipant | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  const handleOpenOverride = (entry: ScoreboardStandingEntry) => {
    setOverrideParticipant({
      participantId: entry.participantId,
      userId: entry.userId,
      displayName: entry.displayName,
      username: entry.username,
      image: entry.image,
      teamName: entry.teamName,
      teamColor: entry.teamColor,
      dailyLogs: entry.dailyLogs,
    });
    setIsOverrideModalOpen(true);
  };

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

  const totalPages = Math.ceil(filteredStandings.length / pageSize);
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const paginatedStandings = filteredStandings.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const totalSecondsCombined =
    (teamA?.totalLoggedSeconds ?? 0) + (teamB?.totalLoggedSeconds ?? 0);
  const totalHoursCombined = Math.round(totalSecondsCombined / 3600);

  const ratioA = matchHeader.ratioPercentageA ?? 0;
  const ratioB = matchHeader.ratioPercentageB ?? 0;

  // Average per person
  const avgHoursA =
    teamA && teamA.companionCount > 0
      ? Math.round(teamA.totalLoggedSeconds / 3600 / teamA.companionCount)
      : 0;
  const avgHoursB =
    teamB && teamB.companionCount > 0
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
            <div className="md:col-span-5 rounded-2xl border border-[#22c55e]/50 bg-[#144520]/20 p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-[#ffffff] flex items-center gap-2 truncate">
                    {teamA.iconEmoji && (
                      <span className="shrink-0">{teamA.iconEmoji}</span>
                    )}
                    <span className="truncate">{teamA.name}</span>
                  </h3>
                  <p className="text-xs text-[#d1d1d1] mt-0.5">
                    {teamA.companionCount} Participants
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs text-[#868686] shrink-0 text-right whitespace-nowrap pl-2 pt-0.5">
                  Weekly Target: {teamA.targetHours}h
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#ffffff] font-sans font-sans-tabular">
                    {teamA.totalLoggedClock}
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#bcbcbc] shrink-0 text-right whitespace-nowrap pl-2">
                    ~{avgHoursA} hrs / Person
                  </span>
                </div>
                <p className="text-[11px] text-[#868686] mt-0.5">
                  Total hours logged
                </p>
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
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-[#434343] bg-[#292929] flex items-center justify-center font-bold text-xs sm:text-sm text-[#ffffff] shadow-md">
                VS
              </div>
            </div>

            {/* Team B / Raven Card */}
            <div className="md:col-span-5 rounded-2xl border border-[#3b82f6]/50 bg-[#102d40]/20 p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-[#ffffff] flex items-center gap-2 truncate">
                    {teamB.iconEmoji && (
                      <span className="shrink-0">{teamB.iconEmoji}</span>
                    )}
                    <span className="truncate">{teamB.name}</span>
                  </h3>
                  <p className="text-xs text-[#d1d1d1] mt-0.5">
                    {teamB.companionCount} Participants
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs text-[#868686] shrink-0 text-right whitespace-nowrap pl-2 pt-0.5">
                  Weekly Target: {teamB.targetHours}h
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#ffffff] font-sans font-sans-tabular">
                    {teamB.totalLoggedClock}
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#bcbcbc] shrink-0 text-right whitespace-nowrap pl-2">
                    ~{avgHoursB} hrs / Person
                  </span>
                </div>
                <p className="text-[11px] text-[#868686] mt-0.5">
                  Total hours logged
                </p>
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
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[#ffffff] gap-1">
              <span className="text-[#22c55e] whitespace-nowrap shrink-0">
                Share: {ratioA}%
              </span>
              <span className="text-[11px] sm:text-xs text-[#d1d1d1] font-normal text-center whitespace-nowrap px-1">
                <span className="sm:hidden">Total: {totalHoursCombined}h</span>
                <span className="hidden sm:inline">
                  Total Challenge Log: {totalHoursCombined} hours
                </span>
              </span>
              <span className="text-[#3b82f6] whitespace-nowrap shrink-0">
                Share: {ratioB}%
              </span>
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
          <h3 className="text-xl font-bold text-[#ffffff]">
            Leaderboard Standings
          </h3>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#868686]" />
            <Input
              type="text"
              placeholder="Search scholar..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 pl-9 pr-3 bg-[#1c1c1c] border-[#333333] text-[#ffffff] placeholder-[#868686] text-xs rounded-full"
            />
          </div>
        </div>

        {filteredStandings.length === 0 ? (
          <p className="text-center py-8 text-xs text-[#868686]">
            No scholars match your search.
          </p>
        ) : (
          <>
            {/* Mobile Leaderboard View (sm:hidden) matching wireframe */}
            <div className="sm:hidden space-y-3">
              {/* Header Card: rank | Participant | total hours */}
              <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] px-3.5 py-2.5 flex items-center justify-between text-[11px] font-bold text-[#868686] uppercase tracking-wider">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center">Rank</span>
                  <span>Participant</span>
                </div>
                <span className="text-right">Total Hours</span>
              </div>

              {/* Participant Cards */}
              <div className="space-y-2.5">
                {paginatedStandings.map((entry) => {
                  const isTeamA = teamA && entry.teamName === teamA.name;
                  return (
                    <div
                      key={entry.participantId}
                      className={`rounded-2xl border border-[#262626] p-3 flex items-center gap-3 transition-colors `}
                    >
                      {/* Rank */}
                      <div className="w-6 text-center shrink-0">
                        <span className="font-bold text-sm text-[#ffffff] font-sans">
                          {entry.rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full bg-[#292929] border border-[#383838] overflow-hidden flex items-center justify-center shrink-0 text-xs">
                        {entry.image ? (
                          <Image
                            src={entry.image}
                            alt={entry.displayName}
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="font-bold text-white">
                            {entry.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Participant Details: Name + Team Badge, @username */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#ffffff] truncate max-w-[110px] xs:max-w-[140px]">
                            {entry.displayName}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                              isTeamA
                                ? "bg-[#144520] border-[#22c55e]/40 text-[#85ff93]"
                                : "bg-[#102d40] border-[#3b82f6]/40 text-[#85d6ff]"
                            }`}
                          >
                            {entry.teamName}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#868686] truncate">
                          @{entry.username || "scholar"}
                        </p>
                      </div>

                      {/* Total hours and +Today's hours */}
                      <div className="shrink-0 text-right font-sans font-sans-tabular space-y-0.5 flex items-center gap-2">
                        <div>
                          <p className="text-xs font-bold text-[#ffffff]">
                            {entry.totalLoggedClock}
                            <span className="text-[10px] font-normal text-[#868686]">
                              /{entry.targetClock}
                            </span>
                          </p>
                          <p className="text-[11px] font-semibold text-[#4ade80]">
                            +{entry.todayLoggedClock}
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenOverride(entry)}
                            className="px-2 py-1 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#d1d1d1] hover:text-white border border-[#383838] transition-colors flex items-center gap-1 text-[10px] font-semibold shrink-0"
                            title="Admin: Edit Study Hours"
                          >
                            <Clock className="h-3 w-3 text-[#3b82f6]" />
                            <span>Edit hr</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Table View (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
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
                  {paginatedStandings.map((entry) => {
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
                                  unoptimized
                                />
                              ) : (
                                <span>
                                  {entry.displayName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-[#ffffff]">
                                {entry.displayName}
                              </p>
                              {entry.username && (
                                <p className="text-[10px] text-[#868686]">
                                  @{entry.username}
                                </p>
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
                            <span>{entry.todayLoggedClock}</span>
                          </span>
                        </td>

                        {/* Total Hours */}
                        <td className="px-4 py-3 text-right font-sans font-sans-tabular text-sm font-bold text-[#ffffff]">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <div className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-[#22c55e]" />
                              <span>{entry.totalLoggedClock}</span>
                              <span className="text-xs text-[#868686] font-normal">
                                / {entry.targetClock}
                              </span>
                            </div>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleOpenOverride(entry)}
                                className="px-2.5 py-1 rounded-lg bg-[#1c1c1c] hover:bg-[#2e2e2e] text-[#d1d1d1] hover:text-white border border-[#383838] transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0"
                                title="Admin: Edit Participant Study Hours"
                              >
                                <Clock className="h-3.5 w-3.5 text-[#3b82f6]" />
                                <span>Edit hr</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <DataPagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredStandings.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="scholars"
            />
          </>
        )}
      </div>

      {/* Admin Hours Override Modal (FEAT-LOG-04) */}
      {isAdmin && (
        <AdminHoursOverrideModal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          challengeId={challenge.id}
          challengeStartDate={challenge.startAt}
          totalChallengeDays={challenge.totalDays || 7}
          participant={overrideParticipant}
          initialDayNumber={challenge.currentDayNumber || 1}
        />
      )}
    </div>
  );
}
