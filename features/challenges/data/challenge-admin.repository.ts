import { prisma } from "@/core/db";
import { evaluateParticipantPunishment } from "@/features/accountability/domain/punishment";
import { recordAuditEvent } from "@/features/audit/data/audit-log.repository";
import {
  assertCanKickoffChallenge,
  assertCanLockChallenge,
  type ChallengeCreationInput,
} from "@/features/challenges/domain/challenge-lifecycle";

export async function listAllChallengesForAdmin() {
  return prisma.challenge.findMany({
    include: {
      host: {
        select: {
          id: true,
          displayName: true,
          username: true,
          image: true,
        },
      },
      teams: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findAdminChallengeDetails(challengeId: string) {
  return prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      host: {
        select: {
          id: true,
          displayName: true,
          username: true,
          image: true,
        },
      },
      teams: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: { participants: true },
          },
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true,
              image: true,
              discordId: true,
            },
          },
          team: true,
          dailyStudyLogs: {
            orderBy: { logDate: "asc" },
            include: {
              overrideBy: {
                select: {
                  displayName: true,
                  username: true,
                },
              },
            },
          },
          weeklyGoals: {
            orderBy: { sortOrder: "asc" },
          },
          punishmentRecord: true,
        },
        orderBy: { enrolledAt: "asc" },
      },
    },
  });
}

export async function createAdminChallenge(
  input: ChallengeCreationInput,
  actor: { id: string; username: string },
) {
  const maxMembers =
    input.format === "SOLOS" ? 1 : input.format === "DUOS" ? 2 : null;

  return prisma.$transaction(async (tx) => {
    const challenge = await tx.challenge.create({
      data: {
        title: input.title.trim(),
        format: input.format,
        status: "UPCOMING",
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        punishmentPfpUrl: input.punishmentPfpUrl?.trim() || null,
        hostId: actor.id,
        teams: {
          create: input.teams.map((team, idx) => ({
            name: team.name.trim(),
            color: team.color?.trim() || null,
            iconEmoji: team.iconEmoji?.trim() || null,
            mascotUrl: team.mascotUrl?.trim() || null,
            maxMembers,
            sortOrder: idx,
          })),
        },
      },
      include: {
        teams: true,
      },
    });

    await recordAuditEvent({
      actorId: actor.id,
      actorUsername: actor.username,
      actionType: "CHALLENGE_CREATED",
      targetEntityId: challenge.id,
      targetEntityType: "CHALLENGE",
      challengeId: challenge.id,
      newValue: {
        title: challenge.title,
        format: challenge.format,
        teamsCount: challenge.teams.length,
      },
      auditReason: "Admin created new challenge tournament",
    });

    return challenge;
  });
}

export async function kickoffChallenge(
  challengeId: string,
  actor: { id: string; username: string },
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  assertCanKickoffChallenge(challenge.status);

  const updated = await prisma.challenge.update({
    where: { id: challengeId },
    data: { status: "ACTIVE" },
  });

  await recordAuditEvent({
    actorId: actor.id,
    actorUsername: actor.username,
    actionType: "CHALLENGE_KICKOFF",
    targetEntityId: challengeId,
    targetEntityType: "CHALLENGE",
    challengeId,
    previousValue: { status: challenge.status },
    newValue: { status: "ACTIVE" },
    auditReason: "Host manually triggered event kickoff (FEAT-CHAL-02)",
  });

  return updated;
}

export async function lockChallengeResults(
  challengeId: string,
  actor: { id: string; username: string },
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      participants: {
        include: {
          dailyStudyLogs: true,
          weeklyGoals: true,
          punishmentRecord: true,
        },
      },
    },
  });

  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  assertCanLockChallenge(challenge.status);

  return prisma.$transaction(async (tx) => {
    // 1. Transition challenge status to COMPLETED
    const completedChallenge = await tx.challenge.update({
      where: { id: challengeId },
      data: { status: "COMPLETED" },
    });

    // 2. Dual-Failure Punishment Evaluation (Law L6 / FEAT-PUN-01)
    for (const participant of challenge.participants) {
      const totalLoggedSeconds = participant.dailyStudyLogs.reduce(
        (sum, log) => sum + log.durationSeconds,
        0,
      );

      const evaluation = evaluateParticipantPunishment(
        participant.targetSeconds,
        totalLoggedSeconds,
        participant.weeklyGoals,
      );

      const isPardoned = participant.punishmentRecord?.isPardoned ?? false;
      const finalStatus = isPardoned
        ? "EXCUSED"
        : evaluation.isPunished
          ? "PUNISHED"
          : "NORMAL";

      await tx.challengeParticipant.update({
        where: { id: participant.id },
        data: { status: finalStatus },
      });

      await tx.punishmentRecord.upsert({
        where: { participantId: participant.id },
        create: {
          challengeId,
          participantId: participant.id,
          isPunished: evaluation.isPunished,
          hoursDeficitSeconds: evaluation.hoursDeficitSeconds,
          incompleteGoalsCount: evaluation.incompleteGoals,
          isPardoned,
          pardonReason: participant.punishmentRecord?.pardonReason ?? null,
          pardonedById: participant.punishmentRecord?.pardonedById ?? null,
        },
        update: {
          isPunished: evaluation.isPunished,
          hoursDeficitSeconds: evaluation.hoursDeficitSeconds,
          incompleteGoalsCount: evaluation.incompleteGoals,
        },
      });
    }

    await recordAuditEvent({
      actorId: actor.id,
      actorUsername: actor.username,
      actionType: "CHALLENGE_LOCKED",
      targetEntityId: challengeId,
      targetEntityType: "CHALLENGE",
      challengeId,
      previousValue: { status: challenge.status },
      newValue: {
        status: "COMPLETED",
        participantsEvaluated: challenge.participants.length,
      },
      auditReason: "Host finalized results and locked challenge (FEAT-CHAL-05)",
    });

    return completedChallenge;
  });
}
