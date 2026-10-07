"use client";

import { useState } from "react";
import type { ChallengeScoreboardViewModel } from "@/features/leaderboard/data/leaderboard-data";
import { ChallengeHeroBanner } from "./challenge-hero-banner";
import { ChallengeOverviewTab } from "./challenge-overview-tab";
import { ChallengeLeaderboardTab } from "@/features/leaderboard/presentation/challenge-leaderboard-tab";
import { ChallengeManageTab } from "./challenge-manage-tab";
import { EventAuditTab } from "@/features/audit/presentation/event-audit-tab";

interface ChallengeViewProps {
  challenge: ChallengeScoreboardViewModel;
  initialTab?: "overview" | "leaderboard" | "about" | "manage" | "audit";
  isAdmin?: boolean;
}

export function ChallengeView({
  challenge,
  initialTab = "overview",
  isAdmin = false,
}: ChallengeViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "leaderboard" | "about" | "manage" | "audit"
  >(initialTab);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <ChallengeHeroBanner challenge={challenge} />

      <div className="flex items-center justify-center w-full overflow-hidden">
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-[#333333] bg-[#292929] p-1 sm:p-1.5 shadow-md max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
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
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
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
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "about"
                ? "bg-[#4a4a4a] text-[#ffffff] shadow"
                : "text-[#868686] hover:text-[#ffffff] hover:bg-[#333333]"
            }`}
          >
            About
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("manage")}
                className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === "manage"
                    ? "bg-[#4a4a4a] text-[#ffffff] shadow"
                    : "text-[#868686] hover:text-[#ffffff] hover:bg-[#333333]"
                }`}
              >
                Manage
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === "audit"
                    ? "bg-[#4a4a4a] text-[#ffffff] shadow"
                    : "text-[#868686] hover:text-[#ffffff] hover:bg-[#333333]"
                }`}
              >
                Audit Log
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === "overview" && (
        <ChallengeOverviewTab challenge={challenge} isAdmin={isAdmin} />
      )}

      {activeTab === "leaderboard" && (
        <div className="space-y-8">
          <ChallengeLeaderboardTab challenge={challenge} isAdmin={isAdmin} />
        </div>
      )}

      {activeTab === "manage" && isAdmin && (
        <ChallengeManageTab challenge={challenge} />
      )}

      {activeTab === "audit" && isAdmin && (
        <EventAuditTab
          challengeId={challenge.id}
          challengeTitle={challenge.title}
        />
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
                  {new Date(challenge.startAt).toUTCString().replace("GMT", "UTC")}
                </p>
              </div>
              <div className="rounded-xl bg-[#1c1c1c] p-3 border border-[#292929]">
                <p className="text-[#868686]">Conclusion Date</p>
                <p className="font-sans font-medium text-[#ffffff] mt-1">
                  {new Date(challenge.endAt).toUTCString().replace("GMT", "UTC")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
