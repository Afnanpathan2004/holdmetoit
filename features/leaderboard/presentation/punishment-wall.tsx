"use client";

import Image from "next/image";
import { useState } from "react";
import { Download, ShieldAlert, ShieldCheck } from "lucide-react";
import type { PunishmentWallData } from "../data/leaderboard-data";
import { toDownloadUrl } from "@/features/challenges/domain/punishment-pfp";

interface PunishmentWallProps {
  wallData: PunishmentWallData;
}

export function PunishmentWall({ wallData }: PunishmentWallProps) {
  const { punishmentPfpUrl, flaggedMembers, isEventCompleted } = wallData;
  const [downloadNotified, setDownloadNotified] = useState(false);
  const pfpExt = punishmentPfpUrl.match(/\.(png|jpe?g|webp)(?:\?|$)/i)?.[1]?.toLowerCase() ?? "jpg";
  const downloadFileName = `holdmetoit-punishment-avatar.${pfpExt}`;

  const handleDownloadClick = () => {
    setDownloadNotified(true);
    setTimeout(() => setDownloadNotified(false), 3000);
  };

  return (
    <section
      className="space-y-6 rounded-3xl border border-[#262626] bg-[#141414] p-6 sm:p-8 shadow-xl"
      aria-label="Accountability Nook and Forfeits"
    >
      {/* Section Header with Download Button */}
      <div className="flex flex-col gap-4 pb-4 border-b border-[#262626] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#401010] text-[#ff5757] border border-[#ef4444]/30">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#ffffff]">
              Forfeits & Accountability Wall
            </h3>
            <p className="text-xs text-[#868686]">
              Dual-failure rule (Law L6): Missing declared hours OR incomplete goals assigns the forfeit avatar
            </p>
          </div>
        </div>

        {/* 1-Click Direct Download Button (FEAT-PUN-03) */}
        <div className="flex items-center gap-3">
          {downloadNotified && (
            <span className="text-xs font-medium text-[#85ff93]">
              Downloading forfeit avatar...
            </span>
          )}
          <a
            href={toDownloadUrl(punishmentPfpUrl, downloadFileName)}
            download={downloadFileName}
            onClick={handleDownloadClick}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#ffffff] px-4 py-2 text-xs font-bold text-[#0d0d0d] shadow transition-all hover:bg-[#e0e0e0] active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            <span>Download Forfeit Avatar (.{pfpExt})</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Forfeit Asset Preview & Flagged Members */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
        {/* Bespoke Asset Showcase Card */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#292929] bg-[#1c1c1c] p-4 sm:col-span-1">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#333333] bg-[#0d0d0d]">
            <Image
              src={punishmentPfpUrl}
              alt="Forfeit Avatar"
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#ffffff]">
              Event Forfeit Avatar
            </span>
            <p className="mt-1 text-[11px] text-[#868686] leading-relaxed">
              Assigned to participants with unmet target hours or goals upon completion
            </p>
          </div>
        </div>

        {/* Flagged Members List */}
        <div className="space-y-3 sm:col-span-2">
          {flaggedMembers.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#22c55e]/30 bg-[#144520]/20 p-4 text-xs text-[#d1d1d1]">
              <ShieldCheck className="h-6 w-6 text-[#85ff93] shrink-0" />
              <div>
                <p className="font-bold text-[#85ff93]">
                  All participants currently on pace
                </p>
                <p className="text-[11px] text-[#868686] mt-0.5">
                  {isEventCompleted
                    ? "All scholars successfully satisfied their target hours and weekly intentions! Zero forfeit avatars assigned."
                    : "All scholars are currently maintaining pace with zero deficits. Keep up the momentum!"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {flaggedMembers.map((member) => (
                <div
                  key={member.participantId}
                  className="flex items-center justify-between rounded-xl border border-[#292929] bg-[#1c1c1c] p-3.5 text-xs shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#ffffff]">
                        {member.displayName}
                      </span>
                      <span className="text-[10px] text-[#868686]">
                        ({member.teamName})
                      </span>
                    </div>
                    <p className="text-[11px] text-[#868686]">
                      {member.incompleteGoalsCount > 0
                        ? `${member.incompleteGoalsCount} Incomplete Goal${
                            member.incompleteGoalsCount === 1 ? "" : "s"
                          }`
                        : "Goals finished"}{" "}
                      • Deficit: <span className="font-sans font-sans-tabular text-[#ff5757] font-bold">-{member.hoursDeficitClock}</span>
                    </p>
                    {member.isPardoned && member.pardonReason && (
                      <p className="text-[11px] text-[#a29dae]">
                        Pardoned: {member.pardonReason}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      member.statusBadge === "Excused"
                        ? "border border-[#8b5cf6]/40 bg-[#230e40] text-[#a29dae]"
                        : "border border-[#ef4444]/40 bg-[#401010] text-[#ff5757]"
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
