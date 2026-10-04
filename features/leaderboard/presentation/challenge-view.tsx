"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ChallengeScoreboardViewModel } from "../data/leaderboard-data";
import { ChallengeHeroBanner } from "./challenge-hero-banner";
import { ChallengeOverviewTab } from "./challenge-overview-tab";
import { ChallengeLeaderboardTab } from "./challenge-leaderboard-tab";
import { ChallengeManageTab } from "@/features/challenges/presentation/challenge-manage-tab";
import { JoinChallengeModal } from "@/features/challenges/presentation/join-challenge-modal";

interface ChallengeViewProps {
  challenge: ChallengeScoreboardViewModel;
  initialTab?: "overview" | "leaderboard" | "about" | "manage";
  isAdmin?: boolean;
}

export function ChallengeView({
  challenge,
  initialTab = "overview",
  isAdmin = false,
}: ChallengeViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "leaderboard" | "about" | "manage"
  >(initialTab);
  const { currentUser } = challenge;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Hero Battle Banner with Artwork (Frame 6 49:1812) */}
      <ChallengeHeroBanner challenge={challenge} />

      {/* 2. Spectator / Join Status Alert if not enrolled or logged in */}
      {!currentUser.isLoggedIn ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#262626] bg-[#141414] p-4 sm:p-5 text-xs">
          <div>
            <h4 className="font-semibold text-sm text-[#ffffff]">
              Guest Spectator View
            </h4>
            <p className="text-[#868686] mt-0.5">
              You are observing this study battle in public read-only mode.
              Connect with Discord to participate and join a house.
            </p>
          </div>

          <Button
            asChild
            className="h-10 px-5 rounded-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium shrink-0"
          >
            <Link
              href={`/api/auth/signin?callbackUrl=/challenge/${challenge.id}`}
            >
              Sign In with Discord
            </Link>
          </Button>
        </div>
      ) : !currentUser.isEnrolled && challenge.status !== "COMPLETED" ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#22c55e]/40 bg-[#144520]/30 p-4 sm:p-5 text-xs">
          <div>
            <h4 className="font-semibold text-sm text-[#ffffff]">
              You are not yet enrolled in this challenge
            </h4>
            <p className="text-[#d1d1d1] mt-0.5">
              Ready to declare your hours and represent a house? Join now before
              kickoff!
            </p>
          </div>

          <JoinChallengeModal
            challengeId={challenge.id}
            challengeTitle={challenge.title}
            format={challenge.format}
            teams={challenge.teams}
          />
        </div>
      ) : null}

      {/* 3. Segmented Pill Tab Bar (Tabs 142:1094) */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#292929] p-1.5 shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-[#4a4a4a] text-[#ffffff] shadow"
                : "text-[#868686] hover:text-[#ffffff] hover:bg-[#333333]"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leaderboard")}
            className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "leaderboard"
                ? "bg-[#4a4a4a] text-[#ffffff] shadow"
                : "text-[#868686] hover:text-[#ffffff] hover:bg-[#333333]"
            }`}
          >
            Leaderboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "about"
                ? "bg-[#4a4a4a] text-[#ffffff] shadow"
                : "text-[#868686] hover:text-[#ffffff] hover:bg-[#333333]"
            }`}
          >
            About
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "manage"
                  ? "bg-[#4a4a4a] text-[#ffffff] shadow"
                  : "text-[#868686] hover:text-[#ffffff] hover:bg-[#333333]"
              }`}
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {/* 4. Active Tab Content Layer */}
      {activeTab === "overview" && (
        <ChallengeOverviewTab challenge={challenge} />
      )}

      {activeTab === "leaderboard" && (
        <div className="space-y-8">
          <ChallengeLeaderboardTab challenge={challenge} />
        </div>
      )}

      {activeTab === "manage" && isAdmin && (
        <ChallengeManageTab challenge={challenge} />
      )}

      {activeTab === "about" && (
        <div className="rounded-3xl border border-[#262626] bg-[#141414] p-6 sm:p-8 space-y-5 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-[#ffffff]">
            About this Challenge
          </h3>
          <p className="text-sm leading-relaxed text-[#d1d1d1]">
            {challenge.title} is an automated study battle governed by the
            HoldMeToIt dual-failure invariant (Law L6). All scholars declare
            their individual target hours and weekly milestone intentions before
            kickoff.
          </p>
          <div className="space-y-3 pt-2">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#868686]">
              Timetable (UTC)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-[#1c1c1c] p-3 border border-[#292929]">
                <p className="text-[#868686]">Kickoff Date</p>
                <p className="font-sans font-medium text-[#ffffff] mt-1">
                  {new Date(challenge.startAt).toUTCString()}
                </p>
              </div>
              <div className="rounded-xl bg-[#1c1c1c] p-3 border border-[#292929]">
                <p className="text-[#868686]">Conclusion Date</p>
                <p className="font-sans font-medium text-[#ffffff] mt-1">
                  {new Date(challenge.endAt).toUTCString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
