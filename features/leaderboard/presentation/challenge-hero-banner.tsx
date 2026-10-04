"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChallengeScoreboardViewModel } from "../data/leaderboard-data";

interface ChallengeHeroBannerProps {
  challenge: ChallengeScoreboardViewModel;
  onQuickLog?: () => void;
}

function ChallengeHeroImage({ src }: { src: string | null }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  return (
    <>
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#292929] to-[#0e0e10]">
        {src && status === "loading" && (
          <div
            role="status"
            aria-label="Loading challenge image"
            className="absolute inset-0 animate-pulse bg-[#292929] motion-reduce:animate-none"
          />
        )}
        {src && status !== "error" && (
          <Image
            key={attempt}
            src={src}
            alt=""
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            className={`object-cover object-center transition-opacity motion-reduce:transition-none ${
              status === "loaded" ? "opacity-60" : "opacity-0"
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/70 to-[#0e0e10]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e10]/90 via-transparent to-[#0e0e10]/80" />
      </div>
      {src && status === "error" && (
        <div role="status" className="relative z-10 flex flex-wrap items-center gap-2 px-6 pt-4 text-xs text-[#d1d1d1] sm:px-8">
          <span>Challenge image unavailable.</span>
          <button
            type="button"
            onClick={() => {
              setAttempt((previous) => previous + 1);
              setStatus("loading");
            }}
            className="min-h-[44px] rounded-md px-2 font-medium underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Retry image
          </button>
        </div>
      )}
    </>
  );
}

export function ChallengeHeroBanner({ challenge, onQuickLog }: ChallengeHeroBannerProps) {
  const { matchHeader, currentUser, teams } = challenge;
  const teamA = matchHeader.teamA ?? teams[0];
  const teamB = matchHeader.teamB ?? teams[1];

  const matchupText =
    teamA && teamB
      ? `${teamA.name} VS ${teamB.name}`
      : challenge.format === "DUOS"
        ? "Duos Battle"
        : challenge.format === "SOLOS"
          ? "Solos FFA"
          : "House Battle";

  const startDateFormatted = new Date(challenge.startAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
  const endDateFormatted = new Date(challenge.endAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#262626] bg-[#0e0e10] shadow-2xl min-h-[220px]">
      {/* A new saved URL remounts the image, clearing any prior load/error state. */}
      <ChallengeHeroImage key={challenge.heroImageUrl} src={challenge.heroImageUrl} />

      {/* 2. Content Layer */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between min-h-[220px]">
        {/* Back Link & Matchup Subtitle */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[#d1d1d1] hover:text-[#ffffff] transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to home</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-[#d1d1d1] font-medium hidden sm:inline-block">
              {matchupText}
            </span>
            <span className="rounded-full bg-[#1c1c1c]/80 border border-[#333333] px-3.5 py-1 text-xs font-medium text-[#ffffff]">
              {startDateFormatted} - {endDateFormatted}
            </span>
          </div>
        </div>

        {/* Title & Action Row */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#ffffff] tracking-tight">
              {challenge.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#d1d1d1] mt-1 sm:hidden">
              {matchupText}
            </p>
          </div>

          {/* Action & Status Capsule */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1 rounded-md bg-[#381717] border border-[#ff5757]/30 px-3 py-1.5 text-xs font-semibold text-[#ff5757]">
              <Clock className="h-3 w-3" />
              {challenge.status === "COMPLETED"
                ? "Completed"
                : `${challenge.daysRemaining} Days Left`}
            </span>

            {currentUser.isEnrolled ? (
              <Button
                asChild
                className="h-10 px-5 rounded-md bg-[#ffffff] text-[#0d0d0d] hover:bg-[#e0e0e0] text-xs font-bold shadow-md"
              >
                <Link href={`/?challenge=${challenge.id}`}>
                  Quick Log
                </Link>
              </Button>
            ) : challenge.status !== "COMPLETED" ? (
              <Button
                asChild
                className="h-10 px-5 rounded-md bg-[#ffffff] text-[#0d0d0d] hover:bg-[#e0e0e0] text-xs font-bold shadow-md"
              >
                <Link href={`/?challenge=${challenge.id}`}>
                  Enroll Now
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
