"use client";

import Image from "next/image";
import { useState } from "react";

import type { PunishmentWallData } from "../data/leaderboard-data";

interface PunishmentWallProps {
  wallData: PunishmentWallData;
}

export function PunishmentWall({ wallData }: PunishmentWallProps) {
  const { punishmentPfpUrl, flaggedMembers, isEventCompleted } = wallData;
  const [downloadNotified, setDownloadNotified] = useState(false);

  const handleDownloadClick = () => {
    setDownloadNotified(true);
    setTimeout(() => setDownloadNotified(false), 3000);
  };

  return (
    <section
      className="space-y-5 rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-8"
      aria-label="Accountability Nook and Forfeits"
    >
      {/* Section Header with Download Button */}
      <div className="flex flex-col gap-3 pb-3 border-b border-cafe-border sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎪</span>
          <div>
            <h3 className="font-serif text-base font-semibold text-cafe-parchment">
              The Accountability Nook & Forfeits
            </h3>
            <p className="text-[11px] text-cafe-oatmeal">
              Playful stakes: Dual-failure rule (missing target hours OR goals assigns the
              forfeit avatar)
            </p>
          </div>
        </div>

        {/* 1-Click Direct Download Button (FEAT-PUN-03) */}
        <div className="flex items-center gap-2">
          {downloadNotified && (
            <span className="font-script text-xs text-cafe-honey-light">
              Downloading forfeit avatar...
            </span>
          )}
          <a
            href={punishmentPfpUrl}
            download="holdmetoit-punishment-avatar.jpg"
            onClick={handleDownloadClick}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-cafe-border bg-cafe-elevated px-4 py-2 text-xs font-medium text-cafe-parchment shadow-sm transition-all hover:border-cafe-honey/50 hover:bg-cafe-card active:scale-[0.98]"
          >
            <svg
              className="h-3.5 w-3.5 text-cafe-honey"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Event Avatar (.jpg)
          </a>
        </div>
      </div>

      {/* Main Grid: Forfeit Asset Preview & Flagged Members */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
        {/* Bespoke Asset Showcase Card */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-cafe-border bg-cafe-elevated/40 p-3.5 sm:col-span-1">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-cafe-border bg-cafe-bg">
            <Image
              src={punishmentPfpUrl}
              alt="Whimsical Forfeit Avatar"
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="text-xs">
            <span className="font-serif font-medium text-cafe-parchment">
              Weekly Forfeit Avatar
            </span>
            <p className="mt-0.5 text-[11px] text-cafe-oatmeal">
              Assigned to companions missing target hours or goals
            </p>
          </div>
        </div>

        {/* Flagged Members List */}
        <div className="space-y-2.5 sm:col-span-2">
          {flaggedMembers.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-cafe-sage/30 bg-cafe-sage-surface/50 p-4 text-xs text-cafe-linen">
              <span className="text-xl">🌿</span>
              <div>
                <p className="font-serif font-medium text-cafe-parchment">
                  Lounge is serene and on pace
                </p>
                <p className="text-[11px] text-cafe-oatmeal">
                  {isEventCompleted
                    ? "All companions successfully hit their target hours and weekly intentions! Zero forfeit avatars assigned."
                    : "All companions are currently maintaining target pace with zero deficits. Keep the gentle rhythm going."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {flaggedMembers.map((member) => (
                <div
                  key={member.participantId}
                  className="flex items-center justify-between rounded-2xl border border-cafe-border bg-cafe-elevated/40 p-3.5 text-xs shadow-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans font-medium text-cafe-parchment">
                        {member.displayName}
                      </span>
                      <span className="text-[10px] text-cafe-ash">
                        ({member.teamName})
                      </span>
                    </div>
                    <p className="text-[10px] text-cafe-oatmeal">
                      {member.incompleteGoalsCount > 0
                        ? `${member.incompleteGoalsCount} Incomplete Goal${
                            member.incompleteGoalsCount === 1 ? "" : "s"
                          }`
                        : "Goals finished"}{" "}
                      • Deficit: -{member.hoursDeficitClock}
                    </p>
                    {member.isPardoned && member.pardonReason && (
                      <p className="font-script text-[11px] text-cafe-lavender">
                        Pardoned: {member.pardonReason}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                      member.statusBadge === "Excused"
                        ? "border border-cafe-lavender/30 bg-cafe-lavender-surface text-cafe-lavender"
                        : "border border-cafe-cinnamon/30 bg-cafe-cinnamon-surface text-cafe-cinnamon"
                    }`}
                  >
                    {member.statusBadge}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
