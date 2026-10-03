"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { logManualSessionHoursAction } from "@/features/leaderboard/api/manual-leaderboard.actions";
import type { ManualLeaderboardViewModel } from "@/features/leaderboard/data/manual-leaderboard.repository";

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
      const res = await logManualSessionHoursAction({
        challengeId: challenge.id,
        userId: currentUserId,
        slotDate: selectedDate,
        sessionHours: hours,
      });

      if (!res.ok) {
        setErrorMessage(res.message);
      } else {
        setSuccessMessage(`Logged ${hours} hrs for ${selectedDate}!`);
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMessage(null);
          router.refresh();
        }, 800);
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* 1. Challenge Header & Matchup Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cafe-border bg-cafe-surface p-6 shadow-cafe sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: challenge.challengeColor ?? "#e08a32",
                  boxShadow: `0 0 10px ${challenge.challengeColor ?? "#e08a32"}`,
                }}
              />
              <span className="font-mono text-xs uppercase tracking-wider text-cafe-honey">
                {challenge.status} Challenge
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-cafe-parchment sm:text-3xl">
              {challenge.challengeName}
            </h1>
            <p className="text-xs text-cafe-oatmeal sm:text-sm">
              Total Community Hours:{" "}
              <span className="font-mono font-bold text-cafe-honey">
                {totalHoursLogged.toFixed(1)} hrs
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {challenge.punishmentPfp && (
              <div className="flex items-center gap-2 rounded-xl border border-cafe-border/60 bg-cafe-card/80 p-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                  <Image
                    src={challenge.punishmentPfp}
                    alt="Forfeit PFP"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-left text-xs">
                  <p className="font-medium text-cafe-linen">Forfeit PFP</p>
                  <p className="text-[10px] text-cafe-oatmeal">Assigned to deficit</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-cafe-honey px-4 py-2.5 font-medium text-cafe-espresso shadow hover:bg-cafe-honey-light transition-colors active:scale-95 text-xs sm:text-sm"
            >
              + Log Session Hours
            </button>
          </div>
        </div>

        {/* Head-to-Head Banner (If 2 or more teams) */}
        {matchBanner.hasMatchup && matchBanner.teamA && matchBanner.teamB && (
          <div className="mt-6 rounded-2xl border border-cafe-border/80 bg-cafe-desk/70 p-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Team A */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg font-bold text-cafe-parchment">
                    {matchBanner.teamA.teamName}
                  </span>
                  {matchBanner.leaderSide === "a" && (
                    <span className="rounded bg-cafe-honey/20 px-2 py-0.5 text-[11px] font-semibold text-cafe-honey">
                      LEAD +{matchBanner.leadMarginHours.toFixed(1)}h
                    </span>
                  )}
                </div>
                <p className="font-mono text-xl font-bold text-cafe-linen">
                  {matchBanner.teamA.totalHours.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-cafe-oatmeal">hrs</span>
                </p>
              </div>

              {/* Match Margin Pill */}
              <div className="text-center font-mono text-xs text-cafe-oatmeal">
                {matchBanner.leadMarginHours === 0 ? (
                  <span className="rounded-full bg-cafe-card px-3 py-1 text-cafe-linen">
                    DEADLOCK TIE
                  </span>
                ) : (
                  <span className="rounded-full bg-cafe-card px-3 py-1 text-cafe-honey">
                    Δ {matchBanner.leadMarginHours.toFixed(1)} hrs margin
                  </span>
                )}
              </div>

              {/* Team B */}
              <div className="space-y-1 sm:text-right">
                <div className="flex items-center gap-2 sm:justify-end">
                  {matchBanner.leaderSide === "b" && (
                    <span className="rounded bg-cafe-honey/20 px-2 py-0.5 text-[11px] font-semibold text-cafe-honey">
                      LEAD +{matchBanner.leadMarginHours.toFixed(1)}h
                    </span>
                  )}
                  <span className="font-serif text-lg font-bold text-cafe-parchment">
                    {matchBanner.teamB.teamName}
                  </span>
                </div>
                <p className="font-mono text-xl font-bold text-cafe-linen">
                  {matchBanner.teamB.totalHours.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-cafe-oatmeal">hrs</span>
                </p>
              </div>
            </div>

            {/* Split Progress Meter */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-cafe-card">
              <div
                className="h-full bg-cafe-honey transition-all duration-500"
                style={{ width: `${matchBanner.ratioPercentageA}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Team Standings Grid */}
      {teams.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
            Team Leaderboard
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div
                key={team.teamId}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-colors ${
                  team.isLeader
                    ? "border-cafe-honey/60 bg-cafe-surface/90 shadow-sm"
                    : "border-cafe-border bg-cafe-card/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs text-cafe-oatmeal">
                      Rank #{team.rank}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-cafe-parchment">
                      {team.teamName}
                    </h3>
                    <p className="text-xs text-cafe-linen">
                      {team.memberCount} study {team.memberCount === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-bold text-cafe-honey">
                      {team.totalHours.toFixed(1)}
                    </span>
                    <span className="block text-[11px] text-cafe-oatmeal">hours</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Individual Standings & Slot Matrix */}
      <div className="space-y-3">
        <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
          Individual Participant Standings
        </h2>

        {standings.length === 0 ? (
          /* Law L9: Empty state */
          <div className="rounded-2xl border border-dashed border-cafe-border p-8 text-center text-cafe-oatmeal">
            <p className="text-sm">No study hours logged yet for this challenge.</p>
            <p className="mt-1 text-xs">
              Click &quot;Log Session Hours&quot; above to add your first study session.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-cafe-border bg-cafe-surface shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-cafe-border bg-cafe-desk text-xs uppercase text-cafe-oatmeal font-mono">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Rank</th>
                  <th className="px-3 py-3.5">Participant</th>
                  <th className="px-3 py-3.5">Team</th>
                  <th className="px-3 py-3.5 text-right">Total Hours</th>
                  {slotDates.map((date) => (
                    <th key={date} className="px-3 py-3.5 text-right font-mono">
                      {date.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border/50 text-cafe-linen">
                {standings.map((p) => (
                  <tr
                    key={p.userId}
                    className={`transition-colors hover:bg-cafe-desk/50 ${
                      p.userId === currentUserId ? "bg-cafe-honey/5" : ""
                    }`}
                  >
                    <td className="py-4 pl-6 pr-3 font-mono font-bold text-cafe-honey">
                      #{p.rank}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {p.userPfp ? (
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-cafe-border">
                            <Image
                              src={p.userPfp}
                              alt={p.discordName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cafe-card font-bold text-cafe-honey text-xs">
                            {p.discordName[0]?.toUpperCase() ?? "U"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-cafe-parchment">
                            {p.discordName}
                          </p>
                          {p.discordId && (
                            <p className="font-mono text-[10px] text-cafe-oatmeal">
                              ID: {p.discordId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs text-cafe-oatmeal">
                      {p.teamName ? (
                        <span className="rounded-md border border-cafe-border/60 bg-cafe-desk px-2 py-0.5 text-cafe-linen">
                          {p.teamName}
                        </span>
                      ) : (
                        <span className="text-cafe-border">—</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-right font-mono font-bold text-cafe-honey">
                      {p.totalHours.toFixed(1)}h
                    </td>
                    {slotDates.map((date) => {
                      const slotVal = p.slotHours[date];
                      return (
                        <td
                          key={date}
                          className="px-3 py-4 text-right font-mono text-xs text-cafe-linen"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-cafe-border bg-cafe-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cafe-border pb-3">
              <h3 className="font-serif text-lg font-bold text-cafe-parchment">
                Log Study Session
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-cafe-oatmeal hover:text-cafe-linen"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogHours} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-cafe-oatmeal mb-1">
                  Slot Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-cafe-border bg-cafe-desk px-3 py-2 text-sm text-cafe-linen focus:border-cafe-honey focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-oatmeal mb-1">
                  Session Hours (e.g. 2.5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="24"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  className="w-full rounded-xl border border-cafe-border bg-cafe-desk px-3 py-2 font-mono text-sm text-cafe-linen focus:border-cafe-honey focus:outline-none"
                  required
                />
              </div>

              {errorMessage && (
                <p className="rounded-lg bg-red-950/40 border border-red-800/40 p-2.5 text-xs text-red-300">
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p className="rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-2.5 text-xs text-emerald-300">
                  {successMessage}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-cafe-border px-4 py-2 text-xs text-cafe-oatmeal hover:text-cafe-linen"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-cafe-honey px-4 py-2 text-xs font-medium text-cafe-espresso hover:bg-cafe-honey-light disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Hours"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
