import type { ChallengeStatus } from "@prisma/client";
import { Download, AlertCircle, CheckCircle2, User as UserIcon } from "lucide-react";

import type { ScoreboardParticipant } from "@/features/leaderboard/data/scoreboard.repository";
import {
  formatSecondsToClock,
  formatSecondsToHuman,
} from "@/features/study-logs/domain/duration";

interface PunishmentNookProps {
  challengeStatus: ChallengeStatus;
  punishedParticipants: ScoreboardParticipant[];
  punishmentPfpUrl: string | null;
}

export function PunishmentNook({
  challengeStatus,
  punishedParticipants,
  punishmentPfpUrl,
}: PunishmentNookProps) {
  // Law L6 / FEAT-PUN-02: Only active when event is COMPLETED
  if (challengeStatus !== "COMPLETED") {
    return null;
  }

  return (
    <section
      aria-label="Accountability Nook"
      className="rounded-3xl border border-cafe-border bg-cafe-card p-6 md:p-8 shadow-cafe"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cafe-border pb-5">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-cafe-terracotta">
            Friendly Stakes
          </span>
          <h2 className="font-serif text-xl font-semibold text-cafe-parchment md:text-2xl">
            The Accountability Nook & Forfeits Corner
          </h2>
          <p className="mt-1 text-xs text-cafe-oatmeal md:text-sm">
            Friendly community stakes with zero cruelty or shame. Dual-failure accountability applies when study hours or declared goals are not met.
          </p>
        </div>

        {/* Download Punishment PFP Button (FEAT-PUN-03) - only rendered if punishmentPfpUrl exists */}
        {punishmentPfpUrl && (
          <a
            href={punishmentPfpUrl}
            download="punishment-pfp.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-cafe-border bg-cafe-wood px-4 py-2 text-sm font-medium text-cafe-parchment shadow-sm transition-colors hover:border-cafe-honey/50 hover:bg-cafe-elevated hover:text-cafe-honey-light"
          >
            <Download className="size-4 text-cafe-honey" />
            <span>Download Event Avatar (.jpg)</span>
          </a>
        )}
      </div>

      <div className="mt-6">
        {punishedParticipants.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-cafe-sage/30 bg-cafe-sage-surface p-5 text-cafe-parchment">
            <CheckCircle2 className="size-5 shrink-0 text-cafe-sage" />
            <p className="text-sm">
              <strong className="font-semibold">All targets met!</strong> Every participant completed their declared intentions and reached their hours. Zero forfeits this round. 🌿
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {punishedParticipants.map((p) => {
              const incompleteGoals = p.goals.filter((g) => !g.completed);
              const hasHourDeficit = p.punishmentEvaluation.hoursDeficitSeconds > 0;
              const hasIncompleteGoals = incompleteGoals.length > 0;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-cafe-terracotta/40 bg-cafe-terracotta-surface/60 p-5 shadow-sm"
                >
                  {/* Top Participant Info */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="size-10 rounded-full border border-cafe-border object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-full border border-cafe-border bg-cafe-wood text-cafe-oatmeal">
                          <UserIcon className="size-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-cafe-parchment">{p.displayName}</p>
                        <p className="text-xs text-cafe-oatmeal">
                          @{p.username} • {p.teamName}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full border border-cafe-terracotta/50 bg-cafe-terracotta-surface px-2.5 py-0.5 text-xs font-semibold text-cafe-parchment">
                      <AlertCircle className="size-3 text-cafe-terracotta" />
                      Forfeit
                    </span>
                  </div>

                  {/* Dual-Failure Reason Callout */}
                  <div className="mt-4 space-y-2 border-t border-cafe-border/50 pt-3 text-xs">
                    {/* Hours Deficit */}
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-cafe-linen">Study Hours:</span>
                      {hasHourDeficit ? (
                        <span className="text-cafe-terracotta">
                          Short by {formatSecondsToHuman(p.punishmentEvaluation.hoursDeficitSeconds)} ({formatSecondsToClock(p.totalLoggedSeconds)} of {formatSecondsToClock(p.targetSeconds)})
                        </span>
                      ) : (
                        <span className="text-cafe-sage">Met ({formatSecondsToClock(p.totalLoggedSeconds)})</span>
                      )}
                    </div>

                    {/* Weekly Goals */}
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-cafe-linen">Goals:</span>
                      {hasIncompleteGoals ? (
                        <div className="flex-1">
                          <span className="text-cafe-terracotta">
                            {incompleteGoals.length} unfinished intention{incompleteGoals.length === 1 ? "" : "s"}:
                          </span>
                          <ul className="mt-1 list-disc list-inside space-y-0.5 text-cafe-oatmeal">
                            {incompleteGoals.map((g) => (
                              <li key={g.id} className="truncate">
                                {g.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <span className="text-cafe-sage">All intentions completed ({p.completedGoalsCount}/{p.totalGoalsCount})</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

