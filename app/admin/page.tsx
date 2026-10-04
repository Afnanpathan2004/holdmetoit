import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus, Users, Palette, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAllChallengesForAdmin } from "@/features/challenges/data/challenge-admin.repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let challenges: Awaited<ReturnType<typeof listAllChallengesForAdmin>> = [];

  try {
    challenges = await listAllChallengesForAdmin();
  } catch (error) {
    challenges = [];
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Top Navigation & Action Controls (Admin console page 87:1796) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#d1d1d1] hover:text-[#ffffff] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="h-10 px-5 rounded-full bg-[#1c1c1c] hover:bg-[#292929] border border-[#333333] text-[#ffffff] text-xs font-semibold shadow-sm"
          >
            <Link href="/admin/challenges/new" className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Create Challenge</span>
            </Link>
          </Button>

          <button
            type="button"
            className="h-10 px-4 rounded-full bg-[#1c1c1c] hover:bg-[#292929] border border-[#333333] text-[#ffffff] text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff4d4d]" />
            <span>Change Accent Color</span>
          </button>
        </div>
      </div>

      {/* 2. Events Section Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-[#ffffff] tracking-tight">Events</h2>
      </div>

      {/* 3. 3-Column Card Grid (Single Challenge Component 114:765) */}
      {challenges.length === 0 ? (
        <div className="rounded-3xl border border-[#262626] bg-[#141414] p-12 text-center space-y-4">
          <p className="text-sm text-[#868686]">No challenges created yet.</p>
          <Button asChild className="h-10 px-6 rounded-full bg-[#ffffff] text-[#0d0d0d] font-bold">
            <Link href="/admin/challenges/new">
              Create First Challenge
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((c) => {
            const formattedDate = new Date(c.startAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
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
                <div className="relative h-36 w-full bg-[#1c1c1c] overflow-hidden">
                  <Image
                    src="/assets/challenge_hero_battle.jpg"
                    alt={c.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1d] via-transparent to-transparent" />
                </div>

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
      )}
    </div>
  );
}
