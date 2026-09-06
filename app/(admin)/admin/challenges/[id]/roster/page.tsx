import { notFound } from "next/navigation";

import { requireAdminOrHost } from "@/features/auth/api/require-admin";
import { findChallengeForAdmin } from "@/features/challenges/data/admin-challenge.repository";
import { AdminRosterGrid } from "@/features/challenges/presentation/admin-roster-grid";

interface AdminRosterPageProps {
  params: {
    id: string;
  };
}

export default async function AdminRosterPage({ params }: AdminRosterPageProps) {
  await requireAdminOrHost(params.id);

  const challenge = await findChallengeForAdmin(params.id);
  if (!challenge) {
    notFound();
  }

  const serializedChallenge = {
    id: challenge.id,
    title: challenge.title,
    format: challenge.format,
    status: challenge.status,
    startAt: challenge.startAt.toISOString(),
    endAt: challenge.endAt.toISOString(),
  };

  const serializedParticipants = challenge.participants.map((p) => ({
    id: p.id,
    userId: p.userId,
    targetSeconds: p.targetSeconds,
    status: p.status,
    user: {
      id: p.user.id,
      name: p.user.name,
      displayName: p.user.displayName,
      username: p.user.username,
      image: p.user.image,
    },
    team: {
      id: p.team.id,
      name: p.team.name,
      iconEmoji: p.team.iconEmoji,
    },
    dailyStudyLogs: p.dailyStudyLogs.map((l) => ({
      id: l.id,
      logDate: l.logDate.toISOString().slice(0, 10),
      durationSeconds: l.durationSeconds,
      isOverride: l.isOverride,
      overrideReason: l.overrideReason,
    })),
    weeklyGoals: p.weeklyGoals.map((g) => ({
      id: g.id,
      description: g.description,
      completed: g.completed,
    })),
    punishmentRecord: p.punishmentRecord
      ? {
          id: p.punishmentRecord.id,
          isPunished: p.punishmentRecord.isPunished,
          isPardoned: p.punishmentRecord.isPardoned,
          pardonReason: p.punishmentRecord.pardonReason,
          hoursDeficitSeconds: p.punishmentRecord.hoursDeficitSeconds,
          incompleteGoalsCount: p.punishmentRecord.incompleteGoalsCount,
        }
      : null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminRosterGrid
        challenge={serializedChallenge}
        participants={serializedParticipants}
      />
    </div>
  );
}

