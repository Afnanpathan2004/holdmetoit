import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/core/auth";
import { getScoreboardData } from "@/features/leaderboard/data/scoreboard.repository";
import { ChallengeScoreboardView } from "@/features/leaderboard/presentation/challenge-scoreboard-view";

interface ChallengePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ChallengePageProps): Promise<Metadata> {
  const scoreboard = await getScoreboardData(params.id);
  if (!scoreboard) {
    return {
      title: "Challenge Not Found | HoldMeToIt",
    };
  }

  return {
    title: `${scoreboard.challenge.title} | Live Scoreboard & Standings`,
    description: `Real-time leaderboard, house margin, and participant standings for ${scoreboard.challenge.title}.`,
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const [scoreboardData, session] = await Promise.all([
    getScoreboardData(params.id),
    auth().catch(() => null),
  ]);

  if (!scoreboardData) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cafe-bg pb-16 text-cafe-parchment">
      <ChallengeScoreboardView
        initialData={scoreboardData}
        isAuthenticated={Boolean(session?.user?.id)}
      />
    </main>
  );
}

