import type { ChallengeStatus } from "@prisma/client";
import { Crown, Trophy, Calendar, Users } from "lucide-react";

import {
  formatSecondsToClock,
  formatSecondsToHuman,
} from "@/features/study-logs/domain/duration";
import type {
  ScoreboardMatchLead,
  ScoreboardTeam,
} from "@/features/leaderboard/data/scoreboard.repository";

interface MatchScoreboardBannerProps {
  challengeTitle: string;
  challengeStatus: ChallengeStatus;
  startAt: Date;
  endAt: Date;
  teams: ScoreboardTeam[];
  leadMargin: ScoreboardMatchLead | null;
}

export function MatchScoreboardBanner({
  challengeTitle,
  challengeStatus,
  startAt,
  endAt,
  teams,
  leadMargin,
}: MatchScoreboardBannerProps) {
  const isHeadToHead = teams.length === 2;
  const teamA = teams[0];
  const teamB = teams[1];

  return (
    <section
      aria-label="Match Scoreboard"
      className="relative overflow-hidden rounded-3xl border border-cafe-border bg-cafe-card p-6 md:p-8 shadow-cafe"
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cafe-border pb-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-cafe-oatmeal">
            The House Cup
          </span>
          <h1 className="font-serif text-2xl font-semibold text-cafe-parchment md:text-3xl">
            {challengeTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {challengeStatus === "UPCOMING" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cafe-border bg-cafe-wood px-3 py-1 text-xs font-medium text-cafe-oatmeal">
              <Calendar className="size-3.5" />
              Kickoff Scheduled
            </span>
          )}
          {challengeStatus === "ACTIVE" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cafe-sage/40 bg-cafe-sage-surface px-3 py-1 text-xs font-medium text-cafe-parchment">
              <span className="size-2 rounded-full bg-cafe-sage" />
              Live Match
            </span>
          )}
          {challengeStatus === "COMPLETED" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cafe-honey/40 bg-cafe-wood px-3 py-1 text-xs font-medium text-cafe-honey-light">
              <Trophy className="size-3.5 text-cafe-honey-light" />
              Final Results
            </span>
          )}
        </div>
      </div>

      {/* Head-to-Head 2-Team Layout */}
      {isHeadToHead ? (
        <div className="mt-6 grid grid-cols-1 items-center gap-6 md:grid-cols-11">
          {/* Team A Card */}
          <div
            className={`flex flex-col items-center rounded-2xl border p-5 text-center transition-colors md:col-span-5 ${
              leadMargin?.leader === "a"
                ? "border-cafe-honey/40 bg-cafe-elevated/80"
                : "border-cafe-border bg-cafe-wood/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{teamA.iconEmoji ?? "🐝"}</span>
              <h2 className="font-serif text-lg font-semibold text-cafe-parchment md:text-xl">
                {teamA.name}
              </h2>
            </div>

            <div className="mt-3">
              <p className="font-mono text-3xl font-semibold tracking-tight text-cafe-parchment md:text-4xl">
                {formatSecondsToClock(teamA.totalSeconds)}
              </p>
              <p className="mt-1 text-xs text-cafe-oatmeal">Cumulative Study Time</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {leadMargin?.leader === "a" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-cafe-honey/50 bg-cafe-wood px-2.5 py-0.5 text-xs font-semibold text-cafe-honey-light">
                  <Crown className="size-3.5 text-cafe-honey-light" />
                  {challengeStatus === "COMPLETED" ? "Winner" : "In Lead"}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-cafe-oatmeal">
                <Users className="size-3 text-cafe-ash" />
                {teamA.memberCount} {teamA.memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>

          {/* Center VS & Lead Margin Delta */}
          <div className="flex flex-col items-center justify-center text-center md:col-span-1">
            <span className="font-serif text-sm font-semibold italic text-cafe-ash">
              vs
            </span>

            <div className="mt-2">
              {challengeStatus === "UPCOMING" ? (
                <span className="rounded-full border border-cafe-border bg-cafe-wood px-2.5 py-1 text-xs text-cafe-oatmeal">
                  Starts {new Date(startAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              ) : leadMargin?.isTie ? (
                <div className="rounded-full border border-cafe-border bg-cafe-elevated px-3 py-1 text-xs font-medium text-cafe-linen">
                  {challengeStatus === "COMPLETED" ? "Tied Event" : "Tied Match"}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="inline-flex items-center rounded-full border border-cafe-honey/30 bg-cafe-elevated px-2.5 py-0.5 font-mono text-xs font-medium text-cafe-honey-light">
                    +{formatSecondsToHuman(leadMargin?.marginSeconds ?? 0)} ahead
                  </span>
                  <span className="mt-1 text-[11px] text-cafe-oatmeal">
                    {leadMargin?.leadingTeam?.name} in lead
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Team B Card */}
          <div
            className={`flex flex-col items-center rounded-2xl border p-5 text-center transition-colors md:col-span-5 ${
              leadMargin?.leader === "b"
                ? "border-cafe-honey/40 bg-cafe-elevated/80"
                : "border-cafe-border bg-cafe-wood/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{teamB.iconEmoji ?? "🦋"}</span>
              <h2 className="font-serif text-lg font-semibold text-cafe-parchment md:text-xl">
                {teamB.name}
              </h2>
            </div>

            <div className="mt-3">
              <p className="font-mono text-3xl font-semibold tracking-tight text-cafe-parchment md:text-4xl">
                {formatSecondsToClock(teamB.totalSeconds)}
              </p>
              <p className="mt-1 text-xs text-cafe-oatmeal">Cumulative Study Time</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {leadMargin?.leader === "b" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-cafe-honey/50 bg-cafe-wood px-2.5 py-0.5 text-xs font-semibold text-cafe-honey-light">
                  <Crown className="size-3.5 text-cafe-honey-light" />
                  {challengeStatus === "COMPLETED" ? "Winner" : "In Lead"}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-cafe-oatmeal">
                <Users className="size-3 text-cafe-ash" />
                {teamB.memberCount} {teamB.memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Multi-Team or Single-Team Layout */
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, idx) => {
            const isLeading = idx === 0 && !leadMargin?.isTie && teams.length > 1;
            return (
              <div
                key={team.id}
                className={`rounded-2xl border p-5 ${
                  isLeading
                    ? "border-cafe-honey/40 bg-cafe-elevated/80"
                    : "border-cafe-border bg-cafe-wood/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{team.iconEmoji ?? "🛡️"}</span>
                    <h2 className="font-serif text-base font-semibold text-cafe-parchment">
                      {team.name}
                    </h2>
                  </div>
                  {isLeading && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cafe-honey/50 bg-cafe-wood px-2 py-0.5 text-[11px] font-semibold text-cafe-honey-light">
                      <Crown className="size-3 text-cafe-honey-light" />
                      Lead
                    </span>
                  )}
                </div>

                <p className="mt-3 font-mono text-2xl font-semibold text-cafe-parchment">
                  {formatSecondsToClock(team.totalSeconds)}
                </p>
                <p className="mt-1 text-xs text-cafe-oatmeal">
                  {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
