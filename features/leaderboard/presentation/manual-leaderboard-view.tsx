"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  captureLogRocketException,
  trackLogRocketEvent,
} from "@/core/observability/logrocket";
import { logManualSessionHoursAction } from "@/features/leaderboard/api/manual-leaderboard.actions";
import type { ManualLeaderboardViewModel } from "@/features/leaderboard/data/manual-leaderboard.repository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ManualLeaderboardViewProps {
  data: ManualLeaderboardViewModel;
  currentUserId?: string;
}

export function ManualLeaderboardView({
  data,
  currentUserId,
}: ManualLeaderboardViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { challenge, summary } = data;
  const { teams, standings, matchBanner, slotDates, totalHoursLogged } = summary;

  // Form state for logging manual session
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]!,
  );
  const [hoursInput, setHoursInput] = useState<string>("2.0");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogHours = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setErrorMessage("Please enter a valid study duration between 0.1 and 24 hours.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await logManualSessionHoursAction({
          challengeId: challenge.id,
          userId: currentUserId,
          slotDate: selectedDate,
          sessionHours: hours,
        });

        if (!res.ok) {
          setErrorMessage(res.message);
          return;
        }

        trackLogRocketEvent("ManualSessionHoursLogged", {
          challengeId: challenge.id,
          slotDate: selectedDate,
          sessionHours: hours,
        });
        setSuccessMessage(`Logged ${hours} hrs for ${selectedDate}!`);
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMessage(null);
          router.refresh();
        }, 800);
      } catch (error) {
        captureLogRocketException(error, {
          tags: { action: "log-manual-session" },
          extra: { challengeId: challenge.id, slotDate: selectedDate },
        });
        setErrorMessage("Could not log session hours. Please try again.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* 1. Challenge Header & Matchup Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#262626] bg-[#141414] p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: challenge.challengeColor ?? "#22c55e",
                  boxShadow: `0 0 10px ${challenge.challengeColor ?? "#22c55e"}`,
                }}
              />
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#868686]">
                {challenge.status} Challenge
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#ffffff] sm:text-3xl">
              {challenge.challengeName}
            </h1>
            <p className="text-xs text-[#868686] sm:text-sm">
              Total Community Hours:{" "}
              <span className="font-sans font-sans-tabular font-bold text-[#ffffff]">
                {totalHoursLogged.toFixed(1)} hrs
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {challenge.punishmentPfp && (
              <div className="flex items-center gap-2 rounded-xl border border-[#292929] bg-[#1c1c1c] p-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                  <Image
                    src={challenge.punishmentPfp}
                    alt="Forfeit PFP"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-left text-xs">
                  <p className="font-medium text-[#ffffff]">Forfeit PFP</p>
                  <p className="text-[10px] text-[#868686]">Assigned to deficit</p>
                </div>
              </div>
            )}

            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-10 px-5 rounded-xl bg-[#ffffff] text-[#0d0d0d] hover:bg-[#e0e0e0] font-bold text-xs sm:text-sm"
            >
              + Log Session Hours
            </Button>
          </div>
        </div>

        {/* Head-to-Head Banner (If 2 or more teams) */}
        {matchBanner.hasMatchup && matchBanner.teamA && matchBanner.teamB && (
          <div className="mt-6 rounded-2xl border border-[#292929] bg-[#1c1c1c] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Team A */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#ffffff]">
                    {matchBanner.teamA.teamName}
                  </span>
                  {matchBanner.leaderSide === "a" && (
                    <span className="rounded bg-[#22c55e]/20 px-2 py-0.5 text-[11px] font-semibold text-[#22c55e]">
                      LEAD +{matchBanner.leadMarginHours.toFixed(1)}h
                    </span>
                  )}
                </div>
                <p className="font-sans font-sans-tabular text-xl font-bold text-[#ffffff]">
                  {matchBanner.teamA.totalHours.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-[#868686]">hrs</span>
                </p>
              </div>

              {/* Match Margin Pill */}
              <div className="text-center text-xs text-[#868686]">
                {matchBanner.leadMarginHours === 0 ? (
                  <span className="rounded-full bg-[#292929] px-3 py-1 font-medium text-[#ffffff]">
                    DEADLOCK TIE
                  </span>
                ) : (
                  <span className="rounded-full bg-[#292929] px-3 py-1 font-medium text-[#22c55e]">
                    Δ {matchBanner.leadMarginHours.toFixed(1)} hrs margin
                  </span>
                )}
              </div>

              {/* Team B */}
              <div className="space-y-1 sm:text-right">
                <div className="flex items-center gap-2 sm:justify-end">
                  {matchBanner.leaderSide === "b" && (
                    <span className="rounded bg-[#22c55e]/20 px-2 py-0.5 text-[11px] font-semibold text-[#22c55e]">
                      LEAD +{matchBanner.leadMarginHours.toFixed(1)}h
                    </span>
                  )}
                  <span className="text-lg font-bold text-[#ffffff]">
                    {matchBanner.teamB.teamName}
                  </span>
                </div>
                <p className="font-sans font-sans-tabular text-xl font-bold text-[#ffffff]">
                  {matchBanner.teamB.totalHours.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-[#868686]">hrs</span>
                </p>
              </div>
            </div>

            {/* Split Progress Meter */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#292929]">
              <div
                className="h-full bg-[#ffffff] transition-all duration-500"
                style={{ width: `${matchBanner.ratioPercentageA}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Team Standings Grid */}
      {teams.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[#ffffff]">
            Team Leaderboard
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div
                key={team.teamId}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-colors ${
                  team.isLeader
                    ? "border-[#ffffff]/40 bg-[#1c1c1c] shadow-sm"
                    : "border-[#262626] bg-[#141414]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-[#868686]">
                      Rank #{team.rank}
                    </span>
                    <h3 className="text-lg font-bold text-[#ffffff]">
                      {team.teamName}
                    </h3>
                    <p className="text-xs text-[#868686]">
                      {team.memberCount} study {team.memberCount === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-sans font-sans-tabular text-2xl font-bold text-[#ffffff]">
                      {team.totalHours.toFixed(1)}
                    </span>
                    <span className="block text-[11px] text-[#868686]">hours</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Individual Standings & Slot Matrix */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#ffffff]">
          Individual Participant Standings
        </h2>

        {standings.length === 0 ? (
          /* Law L9: Empty state */
          <div className="rounded-2xl border border-dashed border-[#292929] bg-[#141414] p-8 text-center text-[#868686]">
            <p className="text-sm">No study hours logged yet for this challenge.</p>
            <p className="mt-1 text-xs">
              Click &quot;Log Session Hours&quot; above to add your first study session.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#262626] bg-[#141414] shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#292929] bg-[#1c1c1c] text-xs uppercase text-[#868686] font-medium">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Rank</th>
                  <th className="px-3 py-3.5">Participant</th>
                  <th className="px-3 py-3.5">Team</th>
                  <th className="px-3 py-3.5 text-right">Total Hours</th>
                  {slotDates.map((date) => (
                    <th key={date} className="px-3 py-3.5 text-right font-medium">
                      {date.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-[#d1d1d1]">
                {standings.map((p) => (
                  <tr
                    key={p.userId}
                    className={`transition-colors hover:bg-[#1c1c1c]/50 ${
                      p.userId === currentUserId ? "bg-white/5" : ""
                    }`}
                  >
                    <td className="py-4 pl-6 pr-3 font-semibold text-[#ffffff]">
                      #{p.rank}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {p.userPfp ? (
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[#292929]">
                            <Image
                              src={p.userPfp}
                              alt={p.discordName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#292929] font-bold text-[#ffffff] text-xs">
                            {p.discordName[0]?.toUpperCase() ?? "U"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#ffffff]">
                            {p.discordName}
                          </p>
                          {p.discordId && (
                            <p className="text-[10px] text-[#868686]">
                              ID: {p.discordId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs text-[#868686]">
                      {p.teamName ? (
                        <span className="rounded-md border border-[#292929] bg-[#1c1c1c] px-2 py-0.5 text-[#d1d1d1]">
                          {p.teamName}
                        </span>
                      ) : (
                        <span className="text-[#4a4a4a]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-right font-sans font-sans-tabular font-bold text-[#ffffff]">
                      {p.totalHours.toFixed(1)}h
                    </td>
                    {slotDates.map((date) => {
                      const slotVal = p.slotHours[date];
                      return (
                        <td
                          key={date}
                          className="px-3 py-4 text-right font-sans font-sans-tabular text-xs text-[#d1d1d1]"
                        >
                          {slotVal ? `${slotVal.toFixed(1)}h` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-[#292929] bg-[#1c1c1c] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#292929] pb-3">
              <h3 className="text-lg font-bold text-[#ffffff]">
                Log Study Session
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#868686] hover:text-[#ffffff] text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogHours} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#868686] mb-1">
                  Slot Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-[#484848] bg-[#545454] px-3 py-2 text-sm text-[#ffffff] focus:border-[#ffffff] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#868686] mb-1">
                  Session Hours (e.g. 2.5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="24"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  className="w-full rounded-xl border border-[#484848] bg-[#545454] px-3 py-2 font-sans font-sans-tabular text-sm text-[#ffffff] focus:border-[#ffffff] focus:outline-none"
                  required
                />
              </div>

              {errorMessage && (
                <p className="rounded-lg bg-[#401010] border border-[#ff5757]/40 p-2.5 text-xs text-[#ff5757]">
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p className="rounded-lg bg-[#144520] border border-[#22c55e]/40 p-2.5 text-xs text-[#22c55e]">
                  {successMessage}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-xl border-[#ffffff] text-[#ffffff] bg-transparent hover:bg-white/10 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-10 px-5 rounded-xl bg-[#ffffff] text-[#0d0d0d] hover:bg-[#e0e0e0] text-xs font-bold"
                >
                  {isPending ? "Saving..." : "Save Hours"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
