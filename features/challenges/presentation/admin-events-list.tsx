"use client";

import { useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChallengeCardImage } from "@/features/challenges/presentation/challenge-card-image";
import { DataPagination } from "@/components/ui/data-pagination";
import type { listAllChallengesForAdmin } from "@/features/challenges/data/challenge-admin.repository";

export type AdminChallengeItem = Awaited<ReturnType<typeof listAllChallengesForAdmin>>[number];

interface AdminEventsListProps {
  challenges: AdminChallengeItem[];
}

export function AdminEventsList({ challenges }: AdminEventsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const totalPages = Math.ceil(challenges.length / pageSize);
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const paginatedChallenges = challenges.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  if (challenges.length === 0) {
    return (
      <div className="rounded-3xl border border-[#262626] bg-[#141414] p-12 text-center space-y-4">
        <p className="text-sm text-[#868686]">No challenges created yet.</p>
        <Button asChild className="h-10 px-6 rounded-full bg-[#ffffff] text-[#0d0d0d] font-bold">
          <Link href="/admin/challenges/new">
            Create First Challenge
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedChallenges.map((c) => {
          const formattedDate = new Date(c.startAt).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          });

          const statusLabel =
            c.status === "ACTIVE"
              ? "Ongoing"
              : c.status === "UPCOMING"
                ? "Upcoming"
                : "Completed";

          const statusStyle =
            c.status === "ACTIVE"
              ? "bg-[#3a6a35] border-[#468c46] text-[#85ff93]"
              : c.status === "UPCOMING"
                ? "bg-[#35596a] border-[#46748c] text-[#85d6ff]"
                : "bg-[#292929] border-[#434343] text-[#bcbcbc]";

          return (
            <div
              key={c.id}
              className="rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden shadow-lg flex flex-col justify-between hover:border-[#383838] transition-all group"
            >
              {/* Banner Thumbnail (Rectangle 16) */}
              <ChallengeCardImage
                key={c.eventBannerUrl}
                src={c.eventBannerUrl?.trim() || null}
                title={c.title}
              />

              {/* Card Content (Rectangle 17) */}
              <div className="p-5 bg-[#1d1d1d] space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#ffffff] truncate">
                    {c.title}
                  </h3>

                  {/* Metadata Badges Row */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-[#ffffff]">
                      <Users className="h-3.5 w-3.5 text-[#868686]" />
                      <span>{c._count.participants}</span>
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle}`}
                    >
                      {statusLabel}
                    </span>

                    <span className="inline-flex items-center rounded-full border border-[#46748c] bg-[#35596a] px-2.5 py-0.5 font-sans font-medium text-[11px] text-[#85d6ff]">
                      {formattedDate}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 flex items-center">
                  <Button
                    asChild
                    className="h-9 w-full rounded-xl bg-[#3d3d3d] border border-[#545454] text-[#ffffff] hover:bg-[#4a4a4a] text-xs font-semibold"
                  >
                    <Link href={`/challenge/${c.id}`}>View Challenge</Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DataPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={challenges.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="challenges"
      />
    </div>
  );
}
