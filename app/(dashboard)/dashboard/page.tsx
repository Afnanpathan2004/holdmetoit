import Link from "next/link";

import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { Button } from "@/components/ui/button";
import { auth } from "@/core/auth";
import { getParticipantCockpit } from "@/features/study-logs/data/cockpit-data";
import { ParticipantCockpit } from "@/features/study-logs/presentation/participant-cockpit";

interface DashboardPageProps {
  searchParams?: {
    challenge?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <EmptyState
        title="Sign in to open your cockpit"
        description="Connect with Discord to log study hours, track catch-up pace, and manage your weekly intentions."
        action={
          <Button asChild className="min-h-[44px]">
            <Link href="/api/auth/signin?callbackUrl=/dashboard">
              Login with Discord
            </Link>
          </Button>
        }
      />
    );
  }

  try {
    const cockpit = await getParticipantCockpit(
      session.user.id,
      searchParams?.challenge,
    );

    if (!cockpit) {
      return (
        <EmptyState
          title="No active challenge enrollment"
          description="You are signed in, but not enrolled in a challenge yet. Once a host adds you to an event, your study desk and weekly goals will appear here."
          action={
            <Button asChild variant="secondary" className="min-h-[44px]">
              <Link href="/">Back to home</Link>
            </Button>
          }
        />
      );
    }

    return <ParticipantCockpit cockpit={cockpit} />;
  } catch {
    return (
      <ErrorState
        title="Could not load your cockpit"
        message="Something went wrong while fetching your challenge data. Please refresh and try again."
      />
    );
  }
}
