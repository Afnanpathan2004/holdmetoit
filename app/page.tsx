import { auth } from "@/core/auth";
import { AppHeader } from "@/features/auth/presentation/auth-nav";
import { HomeCockpitView } from "@/features/study-logs/presentation/home-cockpit-view";
import { getParticipantCockpit } from "@/features/study-logs/data/cockpit-data";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: {
    challenge?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth();

  let cockpit = null;
  if (session?.user?.id) {
    try {
      cockpit = await getParticipantCockpit(session.user.id, searchParams?.challenge);
    } catch {
      cockpit = null;
    }
  }

  const displayName =
    session?.user?.displayName ||
    session?.user?.name ||
    "$USER";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f4f3f6]">
      <AppHeader user={session?.user} />
      <main className="w-full">
        <HomeCockpitView
          displayName={displayName}
          challengeId={cockpit?.challengeId ?? "seed-honey-bees-vs-lavender-butterflies"}
          todayLoggedSeconds={cockpit?.todayLoggedSeconds ?? 0}
          todayLoggedClock={cockpit?.todayLoggedClock ?? "00:00:00"}
          user={session?.user}
          initialGoals={cockpit?.goals}
          cockpit={cockpit}
        />
      </main>
    </div>
  );
}
