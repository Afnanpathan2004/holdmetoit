import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { EmptyState } from "@/components/state/empty-state";
import { Button } from "@/components/ui/button";
import { auth } from "@/core/auth";
import {
   getEffectiveAdminState,
   PARTICIPANT_PREVIEW_COOKIE,
} from "@/features/auth/domain/preview-mode";
import { getChallengeParticipantStats } from "@/features/participant-stats/data/participant-stats.repository";
import { ParticipantStatsView } from "@/features/participant-stats/presentation/participant-stats-view";

interface ParticipantStatsPageProps {
   params: {
      id: string;
      participantId: string;
   };
   searchParams?: {
      as?: string;
      view?: string;
   };
}

export async function generateMetadata({
   params,
}: ParticipantStatsPageProps): Promise<Metadata> {
   const stats = await getChallengeParticipantStats(
      params.id,
      params.participantId
   );

   if (!stats) {
      return {
         title: "Participant Not Found | HoldMeToIt",
      };
   }

   return {
      title: `${stats.profile.displayName} — ${stats.profile.challengeTitle} | HoldMeToIt`,
      description: `View ${stats.profile.displayName}'s study stats, targets, daily history, and leaderboard standing in ${stats.profile.challengeTitle}.`,
   };
}

export default async function ParticipantStatsPage({
   params,
   searchParams,
}: ParticipantStatsPageProps) {
   const session = await auth();
   const cookieStore = await cookies();
   const previewCookie = cookieStore.get(PARTICIPANT_PREVIEW_COOKIE)?.value;

   const { isAdmin } = getEffectiveAdminState({
      userRole: session?.user?.role,
      previewCookie,
      searchParamAs: searchParams?.as,
   });

   const stats = await getChallengeParticipantStats(
      params.id,
      params.participantId,
      {
         currentUserId: session?.user?.id,
         isAdmin,
      }
   );

   const returnLeaderboardUrl = `/challenge/${params.id}?tab=leaderboard${
      searchParams?.view ? `&view=${encodeURIComponent(searchParams.view)}` : ""
   }`;

   if (!stats) {
      return (
         <EmptyState
            title="Participant record not found"
            description="We couldn't locate this participant in the specified challenge. The participant may not be enrolled or might belong to a different challenge."
            action={
               <Button asChild variant="secondary" className="min-h-[44px]">
                  <Link href={returnLeaderboardUrl}>Return to Leaderboard</Link>
               </Button>
            }
         />
      );
   }

   return <ParticipantStatsView stats={stats} viewParam={searchParams?.view} />;
}
