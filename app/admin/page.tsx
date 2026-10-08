import Link from "next/link";
import { Plus } from "lucide-react";
import { listAllChallengesForAdmin } from "@/features/challenges/data/challenge-admin.repository";
import { AdminEventsList } from "@/features/challenges/presentation/admin-events-list";

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
      {/* 1. Back Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white underline underline-offset-4 hover:text-[#d1d1d1] transition-colors"
        >
          <span>← Back</span>
        </Link>
      </div>

      {/* 2. Action Controls (Create Challenge & Change Accent Color) */}
      <div className="flex flex-wrap items-center gap-6 sm:gap-8">
        <Link
          href="/admin/challenges/new"
          className="flex h-[74px] w-full sm:w-[253px] items-center justify-center gap-3 rounded-[20px] bg-[#1d1d1d] hover:bg-[#262626] border border-[#2e2e2e] text-white text-[15px] font-medium transition-all shadow-sm"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Create Challenge</span>
        </Link>

        <button
          type="button"
          className="flex h-[74px] w-full sm:w-[253px] items-center justify-center gap-3 rounded-[20px] bg-[#1d1d1d] hover:bg-[#262626] border border-[#2e2e2e] text-white text-[15px] font-medium transition-all shadow-sm"
        >
          <span className="h-4 w-4 rounded-full bg-[#ff0000] shrink-0" />
          <span>Change Accent Color</span>
        </button>
      </div>

      {/* 3. Events Section Header */}
      <div className="pt-2">
        <h2 className="inline-block text-2xl font-extrabold text-[#ffffff] tracking-tight border-b-2 border-white pb-1.5">
          Events
        </h2>
      </div>

      {/* 4. Events Grid with Pagination */}
      <AdminEventsList challenges={challenges} />
    </div>
  );
}
