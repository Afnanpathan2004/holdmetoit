import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdminOrHost } from "@/features/auth/api/require-admin";
import { findChallengeForAdmin } from "@/features/challenges/data/admin-challenge.repository";
import { findAllUsers } from "@/features/auth/data/user.repository";
import { getAuditLogsForEntities } from "@/features/audit/data/audit.repository";
import { ChallengeAdminHub } from "@/features/challenges/presentation/challenge-admin-hub";

interface AdminChallengePageProps {
  params: {
    id: string;
  };
}

export default async function AdminChallengePage({
  params,
}: AdminChallengePageProps) {
  await requireAdminOrHost(params.id);

  const [challenge, allUsers] = await Promise.all([
    findChallengeForAdmin(params.id),
    findAllUsers(),
  ]);

  if (!challenge) {
    notFound();
  }

  // Gather entity IDs for audit logs (challenge, participants, teams)
  const entityIds = [
    challenge.id,
    ...challenge.participants.map((p) => p.id),
    ...challenge.teams.map((t) => t.id),
  ];

  const auditLogs = await getAuditLogsForEntities(entityIds, 50);

  // Map challenge to serializable props
  const serializedChallenge = {
    id: challenge.id,
    title: challenge.title,
    format: challenge.format as "TEAM_VS_TEAM" | "DUOS" | "SOLOS",
    status: challenge.status as "UPCOMING" | "ACTIVE" | "COMPLETED",
    startAt: challenge.startAt.toISOString(),
    endAt: challenge.endAt.toISOString(),
    punishmentPfpUrl: challenge.punishmentPfpUrl,
    teams: challenge.teams.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      iconEmoji: t.iconEmoji,
      maxMembers: t.maxMembers,
      sortOrder: t.sortOrder,
    })),
    participants: challenge.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      teamId: p.teamId,
      targetSeconds: p.targetSeconds,
      status: p.status,
      createdAt: p.enrolledAt.toISOString(),
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
        durationSeconds: l.durationSeconds,
        logDate: l.logDate.toISOString().slice(0, 10),
        isOverride: l.isOverride,
      })),
      weeklyGoals: p.weeklyGoals.map((g) => ({
        id: g.id,
        description: g.description,
        completed: g.completed,
      })),
      punishmentRecord: p.punishmentRecord
        ? {
            isPunished: p.punishmentRecord.isPunished,
            isPardoned: p.punishmentRecord.isPardoned,
            pardonReason: p.punishmentRecord.pardonReason,
          }
        : null,
    })),
  };

  const serializedUsers = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    displayName: u.displayName,
    username: u.username,
    image: u.image,
  }));

  const serializedAuditLogs = auditLogs.map((log) => ({
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    actorUsername: log.actorUsername,
    actionType: log.actionType,
    targetEntityType: log.targetEntityType,
    auditReason: log.auditReason,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-cafe-oatmeal hover:text-cafe-honey-light transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Host Dashboard</span>
        </Link>
      </div>

      <ChallengeAdminHub
        challenge={serializedChallenge}
        allUsers={serializedUsers}
        auditLogs={serializedAuditLogs}
      />
    </div>
  );
}
