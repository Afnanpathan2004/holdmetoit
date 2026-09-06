import Link from "next/link";

import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { Button } from "@/components/ui/button";
import { auth } from "@/core/auth";
import { getChallengeScoreboard } from "@/features/leaderboard/data/leaderboard-data";
import { ChallengeView } from "@/features/leaderboard/presentation/challenge-view";

interface ChallengePageProps {
  params: {
    id: string;
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const session = await auth();

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

    return <ChallengeView challenge={challenge} />;
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
