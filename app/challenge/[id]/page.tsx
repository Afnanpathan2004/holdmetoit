import Link from "next/link";

import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { Button } from "@/components/ui/button";
import { auth } from "@/core/auth";
import { getChallengeScoreboard } from "@/features/leaderboard/data/leaderboard-data";
import { ChallengeView } from "@/features/challenges/presentation/challenge-view";

interface ChallengePageProps {
  params: {
    id: string;
  };
  searchParams?: {
    tab?: "overview" | "leaderboard" | "about" | "manage";
  };
}

export default async function ChallengePage({
  params,
  searchParams,
}: ChallengePageProps) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  try {
    const challenge = await getChallengeScoreboard(
      params.id,
      session?.user?.id,
    );

    if (!challenge) {
      return (
        <EmptyState
          title="Challenge not found"
          description="We couldn't locate this study challenge in our records. It may not exist or might still be in draft setup."
          action={
            <Button asChild variant="secondary" className="min-h-[44px]">
              <Link href="/">Return to Study Lounge</Link>
            </Button>
          }
        />
      );
    }

    return (
      <ChallengeView
        challenge={challenge}
        initialTab={searchParams?.tab ?? "overview"}
        isAdmin={isAdmin}
      />
    );
  } catch (error) {
    console.error("Failed to load challenge scoreboard:", error);
    return (
      <ErrorState
        title="Could not load scoreboard"
        message="Something went wrong while fetching the live standings. Please refresh the page."
      />
    );
  }
}
