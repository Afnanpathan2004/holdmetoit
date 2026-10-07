import Link from "next/link";
import { Eye } from "lucide-react";
import { auth } from "@/core/auth";
import { AppHeader } from "@/features/auth/presentation/auth-nav";
import { hasAdminPrivileges } from "@/features/auth/domain/auth-roles";
import { HomeCockpitView } from "@/features/study-logs/presentation/home-cockpit-view";
import { getParticipantCockpit } from "@/features/study-logs/data/cockpit-data";
import { findLatestAvailableChallenge } from "@/features/challenges/data/challenge.repository";
import { getUserCategorizedTasks } from "@/features/tasks/data/task.repository";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: {
    challenge?: string;
    as?: string;
    preview?: string;
    role?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth();
  const isActualAdmin = hasAdminPrivileges(session?.user?.role);
  const previewAsParticipant =
    isActualAdmin &&
    (searchParams?.as === "participant" ||
      searchParams?.preview === "participant" ||
      searchParams?.role === "participant");

  const isAdmin = isActualAdmin && !previewAsParticipant;

  let cockpit = null;
  if (session?.user?.id) {
    try {
      cockpit = await getParticipantCockpit(session.user.id, searchParams?.challenge);
    } catch {
      cockpit = null;
    }
  }

  let userTasks = null;
  if (session?.user?.id) {
    try {
      userTasks = cockpit?.userTasks ?? (await getUserCategorizedTasks(session.user.id));
    } catch {
      userTasks = null;
    }
  }

  let upcomingChallenge = null;
  if (session?.user?.id && (!cockpit || cockpit.challengeStatus === "UPCOMING")) {
    try {
      upcomingChallenge = await findLatestAvailableChallenge();
    } catch {
      upcomingChallenge = null;
    }
  }

  const displayName =
    session?.user?.displayName ||
    session?.user?.name ||
    "";

  const effectiveUser =
    previewAsParticipant && session?.user
      ? { ...session.user, role: "PARTICIPANT" }
      : session?.user;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f4f3f6]">
      <AppHeader user={session?.user} />
      {previewAsParticipant && (
        <div className="bg-[#e08a32]/10 border-b border-[#e08a32]/30 px-4 py-2 flex items-center justify-between text-xs text-[#e08a32]">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0" />
            <span className="font-medium">
              Participant Preview Mode active (regular user permissions &amp; views)
            </span>
          </div>
          <Link
            href="/"
            className="font-semibold underline hover:text-white transition-colors"
          >
            Exit Preview (Return to Dev Mode)
          </Link>
        </div>
      )}
      {isActualAdmin && !previewAsParticipant && (
        <div className="bg-[#191919] border-b border-[#2d2d2d] px-4 py-1.5 flex items-center justify-between text-[11px] text-[#868686]">
          <span>Developer / Moderator Mode Active</span>
          <Link
            href="/?as=participant"
            className="inline-flex items-center gap-1.5 text-[#e08a32] hover:text-[#f5a742] font-medium transition-colors"
          >
            <Eye className="h-3 w-3" />
            <span>Preview as Regular Participant</span>
          </Link>
        </div>
      )}
      <main className="w-full">
        <HomeCockpitView
          displayName={displayName}
          challengeId={cockpit?.challengeId ?? upcomingChallenge?.id ?? "seed-honey-bees-vs-lavender-butterflies"}
          todayLoggedSeconds={cockpit?.todayLoggedSeconds ?? 0}
          todayLoggedClock={cockpit?.todayLoggedClock ?? "00:00:00"}
          user={effectiveUser}
          cockpit={cockpit}
          upcomingChallenge={upcomingChallenge}
          userTasks={userTasks}
          isAdmin={isAdmin}
        />
      </main>
    </div>
  );
}
