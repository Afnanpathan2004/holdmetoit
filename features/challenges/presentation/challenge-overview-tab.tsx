"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
   ExternalLink,
   Users,
   CheckCircle,
   Shield,
   Award,
   Clock,
   Search,
   ChevronDown,
   X,
   RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataPagination } from "@/components/ui/data-pagination";
import {
   AdminHoursOverrideModal,
   type AdminHoursOverrideParticipant,
} from "@/features/study-logs/presentation/admin-hours-override-modal";
import type {
   ChallengeScoreboardViewModel,
   ScoreboardStandingEntry,
} from "@/features/leaderboard/data/leaderboard-data";

interface ChallengeOverviewTabProps {
   challenge: ChallengeScoreboardViewModel;
   isAdmin?: boolean;
}

export function ChallengeOverviewTab({
   challenge,
   isAdmin = false,
}: ChallengeOverviewTabProps) {
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedTeamId, setSelectedTeamId] = useState("ALL");
   const [participantPage, setParticipantPage] = useState(1);
   const participantPageSize = 8;
   const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
   const [overrideParticipant, setOverrideParticipant] =
      useState<AdminHoursOverrideParticipant | null>(null);

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
         totalLoggedSeconds: entry.totalLoggedSeconds,
      });
      setIsOverrideModalOpen(true);
   };
   const { standings, teams } = challenge;

   const filteredParticipants = standings.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
         const matches =
            p.displayName.toLowerCase().includes(q) ||
            (p.username && p.username.toLowerCase().includes(q)) ||
            p.teamName.toLowerCase().includes(q);
         if (!matches) return false;
      }

      if (selectedTeamId !== "ALL") {
         if (p.teamId !== selectedTeamId && p.teamName !== selectedTeamId) {
            return false;
         }
      }

      return true;
   });

   const hasActiveFilters =
      searchQuery.trim() !== "" || selectedTeamId !== "ALL";

   const handleResetFilters = () => {
      setSearchQuery("");
      setSelectedTeamId("ALL");
      setParticipantPage(1);
   };

   const totalParticipantPages =
      Math.ceil(filteredParticipants.length / participantPageSize) || 1;
   const safeParticipantPage = Math.min(
      Math.max(1, participantPage),
      Math.max(1, totalParticipantPages)
   );
   const displayedParticipants = filteredParticipants.slice(
      (safeParticipantPage - 1) * participantPageSize,
      safeParticipantPage * participantPageSize
   );

   const teamA = teams[0];

   return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* 1. Left Column: Welcome, How it Works, Rules (Tabs Content 142:1282) */}
         <div className="lg:col-span-7 space-y-6">
            {/* Welcome Card */}
            <div className="rounded-3xl border border-[#262626] bg-[#141414] p-6 sm:p-7 shadow-lg space-y-4">
               <h2 className="text-2xl font-extrabold text-[#ffffff] tracking-tight">
                  Welcome to the {challenge.title}!
               </h2>
               <p className="text-sm leading-relaxed text-[#d1d1d1]">
                  Rally your team! The {challenge.title} is live. It&apos;s time
                  to declare your goals, commit to daily study sessions, solve
                  your deficits with the catch-up model, and compete for
                  victory.
               </p>

               <hr className="border-[#262626]" />

               {/* How it works */}
               <div className="space-y-3">
                  <h3 className="text-lg font-bold text-[#ffffff]">
                     How it works
                  </h3>
                  <ul className="space-y-2.5 text-xs text-[#d1d1d1]">
                     <li className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-[#1c1c1c] border border-[#333333] flex items-center justify-center font-bold text-[10px] text-[#ffffff] shrink-0 mt-0.5">
                           1
                        </span>
                        <span>
                           Make sure you are in the Yeolpumta (YPT) group
                           because hours are verified to the second:{" "}
                           <a
                              href="https://link.yeolpumta.com"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#3b82f6] hover:underline inline-flex items-center gap-1 font-medium"
                           >
                              Open YPT Group Link{" "}
                              <ExternalLink className="h-3 w-3 inline" />
                           </a>
                        </span>
                     </li>
                     <li className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-[#1c1c1c] border border-[#333333] flex items-center justify-center font-bold text-[10px] text-[#ffffff] shrink-0 mt-0.5">
                           2
                        </span>
                        <span>
                           Register and declare your mandatory target hours and
                           weekly milestone intentions.
                        </span>
                     </li>
                     <li className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-[#1c1c1c] border border-[#333333] flex items-center justify-center font-bold text-[10px] text-[#ffffff] shrink-0 mt-0.5">
                           3
                        </span>
                        <span>
                           Participants are divided fairly into competing
                           houses. Cumulative team scores update live with every
                           logged session.
                        </span>
                     </li>
                     <li className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-[#1c1c1c] border border-[#333333] flex items-center justify-center font-bold text-[10px] text-[#ffffff] shrink-0 mt-0.5">
                           4
                        </span>
                        <span>
                           The team that falls behind, or any individual scholar
                           who fails their declared hours or declared goals,
                           wears the assigned forfeit PFP for one week.
                        </span>
                     </li>
                  </ul>
               </div>

               <hr className="border-[#262626]" />

               {/* Prizes & Consequences */}
               <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#ffffff] flex items-center gap-2">
                     <Award className="h-5 w-5 text-[#22c55e]" />
                     Prizes & Accountability
                  </h3>
                  <p className="text-xs text-[#d1d1d1] leading-relaxed">
                     The winning house earns special shiny Discord roles and
                     custom highlight badges for top contributors. Scholars who
                     face dual-failure are held accountable on the Forfeits Wall
                     with downloadable shame avatars.
                  </p>
               </div>
            </div>
         </div>

         {/* 2. Right Column: Participants List (Challenge/Default 64:1806) */}
         <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[#262626] bg-[#141414] p-5 sm:p-6 shadow-lg space-y-4">
               <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                  <h3 className="text-lg font-bold text-[#ffffff] flex items-center gap-2">
                     <Users className="h-4 w-4 text-[#868686]" />
                     Participants
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1c1c1c] border border-[#292929] text-[#868686]">
                     {filteredParticipants.length} of {standings.length}
                  </span>
               </div>

               {/* Search & Team Filter (View by Team) */}
               {standings.length > 0 && (
                  <div className="space-y-2">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#868686]" />
                        <Input
                           type="text"
                           placeholder="Search participants..."
                           value={searchQuery}
                           onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setParticipantPage(1);
                           }}
                           className="h-8 pl-8 pr-7 bg-[#1c1c1c] border-[#333333] text-white text-xs placeholder:text-[#868686] rounded-xl"
                        />
                        {searchQuery && (
                           <button
                              type="button"
                              onClick={() => {
                                 setSearchQuery("");
                                 setParticipantPage(1);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#868686] hover:text-white p-0.5"
                           >
                              <X className="h-3 w-3" />
                           </button>
                        )}
                     </div>

                     {teams.length > 0 && (
                        <div className="relative">
                           <select
                              value={selectedTeamId}
                              onChange={(e) => {
                                 setSelectedTeamId(e.target.value);
                                 setParticipantPage(1);
                              }}
                              className="h-8 w-full rounded-xl border border-[#333333] bg-[#1c1c1c] px-3 pr-8 text-xs text-[#ffffff] focus:border-[#ffffff]/60 focus:outline-none appearance-none cursor-pointer"
                           >
                              <option value="ALL">
                                 All Teams ({standings.length})
                              </option>
                              {teams.map((t) => (
                                 <option key={t.id} value={t.id}>
                                    {t.iconEmoji ? `${t.iconEmoji} ` : ""}
                                    {t.name} ({t.companionCount})
                                 </option>
                              ))}
                           </select>
                           <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#868686] pointer-events-none" />
                        </div>
                     )}

                     {hasActiveFilters && (
                        <div className="flex items-center justify-between text-[11px] text-[#868686] pt-0.5">
                           <span>Filtering active</span>
                           <button
                              type="button"
                              onClick={handleResetFilters}
                              className="hover:text-white underline underline-offset-2"
                           >
                              Clear filters
                           </button>
                        </div>
                     )}
                  </div>
               )}

               {standings.length === 0 ? (
                  <p className="text-xs text-[#868686] text-center py-6 border border-dashed border-[#292929] rounded-xl">
                     No participants enrolled yet.
                  </p>
               ) : filteredParticipants.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-[#292929] rounded-xl space-y-2">
                     <p className="text-xs text-[#868686]">
                        No participants match your search or team filter.
                     </p>
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-7 px-3 text-[11px] rounded-lg border-[#383838] bg-[#242424] hover:bg-[#333333] text-white"
                     >
                        Reset filters
                     </Button>
                  </div>
               ) : (
                  <div className="space-y-2.5">
                     {displayedParticipants.map((p) => {
                        const isTeamA = teamA && p.teamName === teamA.name;
                        return (
                           <div
                              key={p.participantId}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c1c] border border-[#292929] hover:border-[#383838] transition-colors"
                           >
                              <div className="flex items-center gap-3 min-w-0">
                                 <Link
                                    href={`/challenge/${challenge.id}/participant/${p.participantId}`}
                                    className="h-8 w-8 rounded-full bg-[#292929] border border-[#434343] overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0 hover:border-[#22c55e] transition-colors"
                                 >
                                    {p.image ? (
                                       <Image
                                          src={p.image}
                                          alt={p.displayName}
                                          width={32}
                                          height={32}
                                          className="object-cover"
                                       />
                                    ) : (
                                       <span>
                                          {p.displayName
                                             .charAt(0)
                                             .toUpperCase()}
                                       </span>
                                    )}
                                 </Link>
                                 <div className="min-w-0">
                                    <Link
                                       href={`/challenge/${challenge.id}/participant/${p.participantId}`}
                                       className="text-sm font-semibold text-[#ffffff] hover:text-[#22c55e] hover:underline truncate block"
                                    >
                                       {p.displayName}
                                    </Link>
                                    <p className="text-[10px] text-[#868686] truncate">
                                       {p.teamName}
                                    </p>
                                 </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                 <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                                    <span className="text-[11px] font-medium text-[#d1d1d1]">
                                       Active
                                    </span>
                                 </div>
                                 {isAdmin && (
                                    <Button
                                       type="button"
                                       variant="outline"
                                       size="sm"
                                       onClick={() => handleOpenOverride(p)}
                                       className="h-7 px-2.5 rounded-lg border-[#383838] bg-[#242424] hover:bg-[#333333] text-white text-[11px] font-semibold gap-1 shrink-0"
                                       title={`Admin: Edit hours for ${p.displayName}`}
                                    >
                                       <Clock className="h-3 w-3 text-[#3b82f6]" />
                                       <span>Edit hr</span>
                                    </Button>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}

               <DataPagination
                  currentPage={safeParticipantPage}
                  totalPages={totalParticipantPages}
                  totalItems={filteredParticipants.length}
                  pageSize={participantPageSize}
                  onPageChange={setParticipantPage}
                  itemLabel="participants"
                  compact={true}
               />
            </div>
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
