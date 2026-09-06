import { CheckCircle2, User as UserIcon } from "lucide-react";

import { EmptyState } from "@/components/state/empty-state";
import type { ScoreboardParticipant } from "@/features/leaderboard/data/scoreboard.repository";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";

interface StandingsTableProps {
  participants: ScoreboardParticipant[];
}

export function StandingsTable({ participants }: StandingsTableProps) {
  if (participants.length === 0) {
    return (
      <EmptyState
        title="No Participants Found"
        description="No participants match the selected house filter."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View (>= 768px) */}
      <div className="hidden overflow-hidden rounded-3xl border border-cafe-border bg-cafe-card shadow-cafe md:block">
        <table className="w-full text-left text-sm" aria-label="Participant Standings">
          <thead className="border-b border-cafe-border bg-cafe-wood/60 text-xs font-medium uppercase tracking-wider text-cafe-oatmeal">
            <tr>
              <th scope="col" className="px-6 py-4">Rank</th>
              <th scope="col" className="px-6 py-4">Participant</th>
              <th scope="col" className="px-6 py-4">House / Team</th>
              <th scope="col" className="px-6 py-4">Total Logged</th>
              <th scope="col" className="px-6 py-4">Weekly Target</th>
              <th scope="col" className="px-6 py-4">Progress</th>
              <th scope="col" className="px-6 py-4">Goals</th>
              <th scope="col" className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cafe-border">
            {participants.map((p) => {
              const rankColor =
                p.isPodium === 1
                  ? "text-[#ebb06e] font-bold"
                  : p.isPodium === 2
                  ? "text-[#d8cfc4] font-bold"
                  : p.isPodium === 3
                  ? "text-[#9e9284] font-bold"
                  : "text-cafe-ash font-mono";

              const podiumBadge =
                p.isPodium === 1
                  ? "🥇"
                  : p.isPodium === 2
                  ? "🥈"
                  : p.isPodium === 3
                  ? "🥉"
                  : null;

              const badgeClasses =
                p.statusBadge.variant === "sage"
                  ? "border-cafe-sage/40 bg-cafe-sage-surface text-cafe-parchment"
                  : p.statusBadge.variant === "terracotta"
                  ? "border-cafe-terracotta/40 bg-cafe-terracotta-surface text-cafe-parchment"
                  : "border-cafe-border bg-cafe-wood text-cafe-oatmeal";

              return (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-cafe-wood/40"
                >
                  {/* Rank */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-base ${rankColor}`}>
                      #{p.rank}
                      {podiumBadge && <span className="text-sm">{podiumBadge}</span>}
                    </span>
                  </td>

                  {/* Participant */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="size-9 rounded-full border border-cafe-border object-cover"
                        />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-full border border-cafe-border bg-cafe-wood text-cafe-oatmeal">
                          <UserIcon className="size-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-cafe-parchment">
                          {p.displayName}
                        </p>
                        <p className="text-xs text-cafe-oatmeal">@{p.username}</p>
                      </div>
                    </div>
                  </td>

                  {/* House / Team */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-cafe-border bg-cafe-wood/80 px-2.5 py-1 text-xs text-cafe-linen">
                      <span>{p.teamIconEmoji ?? "🛡️"}</span>
                      <span>{p.teamName}</span>
                    </span>
                  </td>

                  {/* Total Logged */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-mono font-medium text-cafe-parchment">
                      {formatSecondsToClock(p.totalLoggedSeconds)}
                    </span>
                  </td>

                  {/* Weekly Target */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-mono text-cafe-oatmeal">
                      {formatSecondsToClock(p.targetSeconds)}
                    </span>
                  </td>

                  {/* Progress Bar & % */}
                  <td className="px-6 py-4">
                    <div className="w-28">
                      <div className="flex items-center justify-between text-xs text-cafe-oatmeal">
                        <span>{p.progressPercent}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-cafe-wood">
                        <div
                          className="h-full rounded-full bg-cafe-honey transition-all duration-300"
                          style={{ width: `${Math.min(100, p.progressPercent)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Goals */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-cafe-linen">
                      <CheckCircle2 className="size-3.5 text-cafe-sage" />
                      <span>
                        {p.completedGoalsCount}/{p.totalGoalsCount}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClasses}`}
                    >
                      {p.statusBadge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (< 768px, down to 360px) */}
      <div className="space-y-3 md:hidden">
        {participants.map((p) => {
          const rankColor =
            p.isPodium === 1
              ? "text-[#ebb06e]"
              : p.isPodium === 2
              ? "text-[#d8cfc4]"
              : p.isPodium === 3
              ? "text-[#9e9284]"
              : "text-cafe-ash font-mono";

          const podiumBadge =
            p.isPodium === 1
              ? "🥇"
              : p.isPodium === 2
              ? "🥈"
              : p.isPodium === 3
              ? "🥉"
              : null;

          const badgeClasses =
            p.statusBadge.variant === "sage"
              ? "border-cafe-sage/40 bg-cafe-sage-surface text-cafe-parchment"
              : p.statusBadge.variant === "terracotta"
              ? "border-cafe-terracotta/40 bg-cafe-terracotta-surface text-cafe-parchment"
              : "border-cafe-border bg-cafe-wood text-cafe-oatmeal";

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm"
            >
              {/* Card Header: Rank, User, Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`font-semibold text-sm ${rankColor}`}>
                    #{p.rank} {podiumBadge}
                  </span>
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.displayName}
                      className="size-8 rounded-full border border-cafe-border object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full border border-cafe-border bg-cafe-wood text-cafe-oatmeal shrink-0">
                      <UserIcon className="size-3.5" />
                    </div>
                  )}
                  <div className="min-w-0 truncate">
                    <p className="truncate text-sm font-medium text-cafe-parchment">
                      {p.displayName}
                    </p>
                    <p className="truncate text-xs text-cafe-oatmeal">@{p.username}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                >
                  {p.statusBadge.label}
                </span>
              </div>

              {/* Card Body: House & Clocks */}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-cafe-border/60 pt-3">
                <span className="inline-flex items-center gap-1 rounded-md border border-cafe-border bg-cafe-wood px-2 py-0.5 text-xs text-cafe-linen">
                  <span>{p.teamIconEmoji ?? "🛡️"}</span>
                  <span className="truncate max-w-[120px]">{p.teamName}</span>
                </span>

                <div className="text-right">
                  <p className="font-mono text-sm font-medium text-cafe-parchment">
                    {formatSecondsToClock(p.totalLoggedSeconds)}
                  </p>
                  <p className="font-mono text-[11px] text-cafe-oatmeal">
                    target {formatSecondsToClock(p.targetSeconds)}
                  </p>
                </div>
              </div>

              {/* Card Footer: Progress & Goals */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-cafe-oatmeal">
                  <span>{p.progressPercent}% achieved</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-cafe-sage" />
                    {p.completedGoalsCount}/{p.totalGoalsCount} goals
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-cafe-wood">
                  <div
                    className="h-full rounded-full bg-cafe-honey"
                    style={{ width: `${Math.min(100, p.progressPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

