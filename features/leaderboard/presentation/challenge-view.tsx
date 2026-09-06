"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { ChallengeScoreboardViewModel } from "../data/leaderboard-data";
import { MatchBanner } from "./match-banner";
import { PunishmentWall } from "./punishment-wall";
import { StandingsTable } from "./standings-table";

interface ChallengeViewProps {
  challenge: ChallengeScoreboardViewModel;
}

export function ChallengeView({ challenge }: ChallengeViewProps) {
  const { currentUser } = challenge;

  return (
    <div className="space-y-8">
      {/* 1. Head-to-Head Live Scoreboard Match Banner (FEAT-LEAD-01) */}
      <MatchBanner challenge={challenge} />

      {/* 2. Spectator / Participant Identity Banner (FEAT-AUTH-02, Law L4) */}
      {!currentUser.isLoggedIn ? (
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-cafe-border bg-cafe-card/90 p-4 text-xs backdrop-blur-sm sm:flex-row sm:p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍵</span>
            <div>
              <h4 className="font-serif text-sm font-semibold text-cafe-parchment">
                Lounge Guest View (Public Spectator)
              </h4>
              <p className="font-sans text-cafe-oatmeal">
                You are observing the study lounge in public read-only mode. All house
                standings and forfeit walls are live. Sign in via Discord to log study
                hours and join a house.
              </p>
            </div>
          </div>

          <Button asChild className="min-h-[44px] shrink-0 bg-[#5865F2] hover:bg-[#4752C4]">
            <Link href={`/api/auth/signin?callbackUrl=/challenge/${challenge.id}`}>
              Sign In with Discord
            </Link>
          </Button>
        </div>
      ) : currentUser.isEnrolled ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-cafe-honey/40 bg-cafe-elevated/80 p-4 text-xs sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🕯️</span>
            <div>
              <p className="font-serif font-medium text-cafe-parchment">
                You are enrolled in this sprint!
              </p>
              <p className="text-[11px] text-cafe-oatmeal">
                Ready to log study hours or check off your weekly intentions?
              </p>
            </div>
          </div>

          <Button asChild className="min-h-[40px]">
            <Link href={`/dashboard?challenge=${challenge.id}`}>
              Open My Study Desk
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-cafe-border bg-cafe-card/70 p-3.5 text-xs text-cafe-oatmeal">
          <span className="flex items-center gap-2">
            <span>👁️</span> Signed in as spectator. Not enrolled as a participant in this sprint.
          </span>
          <Button asChild variant="outline" size="sm" className="min-h-[36px]">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      )}

      {/* 3. Unified Roster Standings Table (FEAT-LEAD-02) */}
      <StandingsTable standings={challenge.standings} teams={challenge.teams} />

      {/* 4. The Accountability Nook & Forfeits Wall (FEAT-PUN-02, FEAT-PUN-03) */}
      <PunishmentWall wallData={challenge.punishmentWall} />
    </div>
  );
}
