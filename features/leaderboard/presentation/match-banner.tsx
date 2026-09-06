import Image from "next/image";

import type { ChallengeScoreboardViewModel } from "../data/leaderboard-data";

interface MatchBannerProps {
  challenge: ChallengeScoreboardViewModel;
}

export function MatchBanner({ challenge }: MatchBannerProps) {
  const { matchHeader, status } = challenge;
  const teamA = matchHeader.teamA;
  const teamB = matchHeader.teamB;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-cafe-border bg-cafe-surface shadow-cafe">
      {/* Illustrated Background Asset with Soft Dark Walnut Vignette */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/hero_cafe.jpg"
          alt="Cozy Study Café"
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover object-center opacity-40 filter blur-[0.2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cafe-surface via-cafe-surface/80 to-cafe-surface/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-cafe-surface/90 via-transparent to-cafe-surface/70" />
      </div>

      {/* Atmospheric Content Layer */}
      <div className="relative z-10 space-y-5 p-6 sm:p-8">
        {/* Top Status and Time Remaining */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-cafe-oatmeal">
          <span className="flex items-center gap-2 font-medium text-cafe-linen">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-cafe-honey shadow-[0_0_8px_#e08a32]" />
            {challenge.title} •{" "}
            {status === "COMPLETED"
              ? "Completed Sprint"
              : status === "UPCOMING"
                ? "Starting Soon"
                : `Day ${challenge.currentDayNumber} of ${challenge.totalDays}`}
          </span>
          <span className="rounded-lg border border-cafe-border/60 bg-cafe-card/80 px-2.5 py-1 font-mono text-cafe-oatmeal backdrop-blur-sm">
            {challenge.timeRemainingHuman}
          </span>
        </div>

        {/* Headline & Marginalia Note */}
        <div className="max-w-xl space-y-2">
          <h2 className="font-serif text-2xl font-medium leading-tight text-cafe-parchment sm:text-3xl">
            Rain on the glass, warm mug on the desk.
          </h2>
          <p className="font-sans text-xs leading-relaxed text-cafe-linen sm:text-sm">
            Welcome to the quiet lounge. Track your study hours without rush or guilt.
            Deficits roll forward gently with our catch-up model—just stay consistent today.
          </p>
          <div className="pt-0.5">
            <span className="font-script text-base tracking-wide text-cafe-honey-light/95">
              ~ &ldquo;quiet study, warm tea, serene progress&rdquo; ~
            </span>
          </div>
        </div>

        {/* House Cup Matchup Plaque (Noticeboard Style) (FEAT-LEAD-01) */}
        {matchHeader.hasMatchup && teamA && teamB ? (
          <div className="pt-2">
            <div className="rounded-2xl border border-cafe-border bg-cafe-bg/85 p-4 shadow-lg backdrop-blur-md sm:p-5">
              <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-7">
                {/* Team A */}
                <div
                  className={`flex items-center justify-between rounded-2xl border p-3.5 shadow-sm transition-all md:col-span-3 ${
                    teamA.isLeader
                      ? "border-cafe-honey/50 bg-cafe-card/80"
                      : "border-cafe-border bg-cafe-card/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-cafe-border bg-cafe-elevated">
                      {teamA.mascotUrl ? (
                        <Image
                          src={teamA.mascotUrl}
                          alt={teamA.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">
                          {teamA.iconEmoji ?? "🐝"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-serif text-sm font-semibold text-cafe-parchment">
                          {teamA.name}
                        </h3>
                        {teamA.isLeader && (
                          <span className="rounded border border-cafe-honey/30 bg-cafe-honey/10 px-1.5 py-0.5 text-[10px] font-medium text-cafe-honey">
                            👑 In Lead
                          </span>
                        )}
                      </div>
                      <span className="font-sans text-[11px] text-cafe-oatmeal">
                        {teamA.companionCount}{" "}
                        {teamA.companionCount === 1 ? "Companion" : "Companions"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-tabular text-xl font-semibold text-cafe-honey-light sm:text-2xl">
                      {teamA.totalLoggedClock}
                    </span>
                    <span className="block font-mono text-[10px] text-cafe-ash">
                      Cumulative Hours
                    </span>
                  </div>
                </div>

                {/* Match Margin Divider */}
                <div className="flex flex-col items-center justify-center text-center md:col-span-1">
                  <span className="font-serif text-xs italic text-cafe-oatmeal">vs</span>
                  <span className="mt-1 font-mono text-[11px] font-medium text-cafe-honey">
                    {matchHeader.leadMarginSeconds === 0
                      ? "Tied"
                      : `+${matchHeader.leadMarginClock}`}
                  </span>
                  <span className="font-sans text-[9px] text-cafe-ash">Lead Margin</span>
                </div>

                {/* Team B */}
                <div
                  className={`flex items-center justify-between rounded-2xl border p-3.5 shadow-sm transition-all md:col-span-3 ${
                    teamB.isLeader
                      ? "border-cafe-lavender/50 bg-cafe-card/80"
                      : "border-cafe-border bg-cafe-card/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-cafe-border bg-cafe-elevated">
                      {teamB.mascotUrl ? (
                        <Image
                          src={teamB.mascotUrl}
                          alt={teamB.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">
                          {teamB.iconEmoji ?? "🦋"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-serif text-sm font-semibold text-cafe-parchment">
                          {teamB.name}
                        </h3>
                        {teamB.isLeader && (
                          <span className="rounded border border-cafe-lavender/30 bg-cafe-lavender/10 px-1.5 py-0.5 text-[10px] font-medium text-cafe-lavender">
                            👑 In Lead
                          </span>
                        )}
                      </div>
                      <span className="font-sans text-[11px] text-cafe-oatmeal">
                        {teamB.companionCount}{" "}
                        {teamB.companionCount === 1 ? "Companion" : "Companions"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-tabular text-xl font-semibold text-cafe-linen sm:text-2xl">
                      {teamB.totalLoggedClock}
                    </span>
                    <span className="block font-mono text-[10px] text-cafe-ash">
                      Cumulative Hours
                    </span>
                  </div>
                </div>
              </div>

              {/* Gentle ratio progress bar */}
              <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-cafe-card">
                <div
                  className="h-full rounded-l-full bg-cafe-honey transition-all duration-500"
                  style={{ width: `${matchHeader.ratioPercentageA}%` }}
                  title={`${teamA.name}: ${matchHeader.ratioPercentageA}%`}
                />
                <div
                  className="h-full rounded-r-full bg-cafe-lavender transition-all duration-500"
                  style={{ width: `${matchHeader.ratioPercentageB}%` }}
                  title={`${teamB.name}: ${matchHeader.ratioPercentageB}%`}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Multi-team / Solo match plaque */
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {challenge.teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-2xl border border-cafe-border bg-cafe-bg/85 p-3.5 backdrop-blur-md"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{team.iconEmoji ?? "☕"}</span>
                  <div>
                    <h3 className="font-serif text-sm font-semibold text-cafe-parchment">
                      {team.name}
                    </h3>
                    <span className="font-sans text-[11px] text-cafe-oatmeal">
                      {team.companionCount} {team.companionCount === 1 ? "Companion" : "Companions"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-tabular text-lg font-semibold text-cafe-honey-light">
                    {team.totalLoggedClock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
