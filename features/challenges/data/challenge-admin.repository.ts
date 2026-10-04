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

export async function adminEnrollParticipant(params: {
  challengeId: string;
  userId: string;
  teamId: string;
  targetSeconds?: number;
  reason: string;
  admin: { id: string; username: string };
}) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: params.challengeId },
  });

  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  const existing = await prisma.challengeParticipant.findUnique({
    where: {
      challengeId_userId: {
        challengeId: params.challengeId,
        userId: params.userId,
      },
    },
  });

  if (existing) {
    throw new Error("User is already enrolled in this challenge.");
  }

  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  if (!team || team.challengeId !== params.challengeId) {
    throw new Error("Selected team does not belong to this challenge.");
  }

  if (team.maxMembers && team._count.participants >= team.maxMembers) {
    throw new Error(
      `Team ${team.name} is full (max ${team.maxMembers} member${team.maxMembers === 1 ? "" : "s"}).`,
    );
  }

  const participant = await prisma.challengeParticipant.create({
    data: {
      userId: params.userId,
      challengeId: params.challengeId,
      teamId: params.teamId,
      targetSeconds: params.targetSeconds ?? 0,
      status: "NORMAL",
    },
    include: {
      team: true,
      challenge: true,
      user: true,
    },
  });

  await recordAuditEvent({
    actorId: params.admin.id,
    actorUsername: params.admin.username,
    actionType: "ROSTER_EDIT",
    targetEntityId: participant.id,
    targetEntityType: "PARTICIPANT",
    challengeId: params.challengeId,
    previousValue: null,
    newValue: {
      userId: params.userId,
      teamId: params.teamId,
      targetSeconds: params.targetSeconds ?? 0,
    },
    auditReason: params.reason.trim(),
  });

  return participant;
}

export interface UpdateAdminChallengeInput {
  title: string;
  startAt: string;
  endAt: string;
  punishmentPfpUrl?: string | null;
  teams: Array<{
    id?: string;
    name: string;
    color?: string | null;
    iconEmoji?: string | null;
    mascotUrl?: string | null;
  }>;
}

export async function updateAdminChallenge(
  challengeId: string,
  input: UpdateAdminChallengeInput,
  actor: { id: string; username: string },
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { teams: true },
  });

  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  const maxMembers =
    challenge.format === "SOLOS" ? 1 : challenge.format === "DUOS" ? 2 : null;

  return prisma.$transaction(async (tx) => {
    // 1. Update challenge basic details
    const updatedChallenge = await tx.challenge.update({
      where: { id: challengeId },
      data: {
        title: input.title.trim(),
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        punishmentPfpUrl: input.punishmentPfpUrl?.trim() || null,
      },
    });

    // 2. Process teams: update existing or create new ones
    const keptTeamIds: string[] = [];
    for (let i = 0; i < input.teams.length; i++) {
      const teamInput = input.teams[i];
      if (teamInput.id) {
        keptTeamIds.push(teamInput.id);
        await tx.team.update({
          where: { id: teamInput.id },
          data: {
            name: teamInput.name.trim(),
            color: teamInput.color?.trim() || null,
            iconEmoji: teamInput.iconEmoji?.trim() || null,
            mascotUrl: teamInput.mascotUrl?.trim() || null,
            sortOrder: i,
          },
        });
      } else {
        const newTeam = await tx.team.create({
          data: {
            challengeId,
            name: teamInput.name.trim(),
            color: teamInput.color?.trim() || null,
            iconEmoji: teamInput.iconEmoji?.trim() || null,
            mascotUrl: teamInput.mascotUrl?.trim() || null,
            maxMembers,
            sortOrder: i,
          },
        });
        if (newTeam?.id) {
          keptTeamIds.push(newTeam.id);
        }
      }
    }

    // Delete removed teams that have no participants
    if (keptTeamIds.length > 0) {
      await tx.team.deleteMany({
        where: {
          challengeId,
          id: { notIn: keptTeamIds },
          participants: { none: {} },
        },
      });
    }

    await recordAuditEvent({
      actorId: actor.id,
      actorUsername: actor.username,
      actionType: "CHALLENGE_UPDATED",
      targetEntityId: challengeId,
      targetEntityType: "CHALLENGE",
      challengeId,
      previousValue: {
        title: challenge.title,
        startAt: challenge.startAt,
        endAt: challenge.endAt,
      },
      newValue: {
        title: updatedChallenge.title,
        startAt: updatedChallenge.startAt,
        endAt: updatedChallenge.endAt,
      },
      auditReason: "Admin updated challenge configuration and team identities",
    });

    return updatedChallenge;
  });
}

export async function reassignParticipantTeam(params: {
  participantId: string;
  newTeamId: string;
  reason?: string;
  admin: { id: string; username: string };
}) {
  const participant = await prisma.challengeParticipant.findUnique({
    where: { id: params.participantId },
    include: { team: true, user: true },
  });

  if (!participant) {
    throw new Error("Participant not found.");
  }

  if (participant.teamId === params.newTeamId) {
    return participant;
  }

  const destinationTeam = await prisma.team.findUnique({
    where: { id: params.newTeamId },
    include: {
      _count: { select: { participants: true } },
    },
  });

  if (!destinationTeam || destinationTeam.challengeId !== participant.challengeId) {
    throw new Error("Selected destination team does not belong to this challenge.");
  }

  if (
    destinationTeam.maxMembers &&
    destinationTeam._count.participants >= destinationTeam.maxMembers
  ) {
    throw new Error(
      `Team ${destinationTeam.name} is full (max ${destinationTeam.maxMembers} member${destinationTeam.maxMembers === 1 ? "" : "s"}).`,
    );
  }

  const updatedParticipant = await prisma.challengeParticipant.update({
    where: { id: params.participantId },
    data: { teamId: params.newTeamId },
    include: { team: true, user: true },
  });

  await recordAuditEvent({
    actorId: params.admin.id,
    actorUsername: params.admin.username,
    actionType: "ROSTER_EDIT",
    targetEntityId: participant.id,
    targetEntityType: "PARTICIPANT",
    challengeId: participant.challengeId,
    previousValue: {
      teamId: participant.teamId,
      teamName: participant.team.name,
    },
    newValue: {
      teamId: updatedParticipant.teamId,
      teamName: updatedParticipant.team.name,
    },
    auditReason:
      params.reason?.trim() ||
      `Host reassigned ${participant.user.displayName || participant.user.username} from ${participant.team.name} to ${destinationTeam.name}`,
  });

  return updatedParticipant;
}

export async function deleteAdminChallenge(
  challengeId: string,
  actor: { id: string; username: string },
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { teams: true },
  });

  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Delete daily study logs for all participants in this challenge
    await tx.dailyStudyLog.deleteMany({
      where: {
        participant: {
          challengeId,
        },
      },
    });

    // 2. Delete weekly goals for all participants in this challenge
    await tx.weeklyGoal.deleteMany({
      where: {
        participant: {
          challengeId,
        },
      },
    });

    // 3. Delete punishment records
    await tx.punishmentRecord.deleteMany({
      where: { challengeId },
    });

    // 4. Delete leaderboard entries
    await tx.leaderboardEntry.deleteMany({
      where: { challengeId },
    });

    // 5. Delete challenge participants
    await tx.challengeParticipant.deleteMany({
      where: { challengeId },
    });

    // 6. Delete team members
    await tx.teamMember.deleteMany({
      where: {
        team: {
          challengeId,
        },
      },
    });

    // 7. Delete teams
    await tx.team.deleteMany({
      where: { challengeId },
    });

    // 8. Delete the challenge
    const deleted = await tx.challenge.delete({
      where: { id: challengeId },
    });

    await recordAuditEvent({
      actorId: actor.id,
      actorUsername: actor.username,
      actionType: "CHALLENGE_DELETED",
      targetEntityId: challengeId,
      targetEntityType: "CHALLENGE",
      challengeId,
      previousValue: {
        title: challenge.title,
        status: challenge.status,
      },
      newValue: null,
      auditReason: `Host permanently deleted challenge "${challenge.title}"`,
    });

    return deleted;
  });
}


