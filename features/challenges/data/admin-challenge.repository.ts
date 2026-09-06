import type { ChallengeFormat, ChallengeStatus, Prisma } from "@prisma/client";

import { prisma } from "@/core/db";
import { evaluateParticipantPunishment } from "@/features/accountability/domain/punishment";
import { createAuditEntry } from "@/features/audit/data/audit.repository";
import {
  assertChallengeTransition,
  assertKickoffPrerequisites,
} from "@/features/challenges/domain/lifecycle";
import { sumLoggedSeconds } from "@/features/leaderboard/domain/catch-up-presentation";

export class ChallengeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChallengeValidationError";
  }
}

export interface CreateTeamInput {
  name: string;
  color?: string | null;
  iconEmoji?: string | null;
  mascotUrl?: string | null;
  maxMembers?: number | null;
  sortOrder?: number;
}

export interface CreateChallengeInput {
  title: string;
  format: ChallengeFormat;
  startAt: Date;
  endAt: Date;
  punishmentPfpUrl?: string | null;
  teams: CreateTeamInput[];
}

export interface ActorContext {
  id: string;
  username: string;
}

/**
 * Creates a challenge with teams and records an audit entry (FEAT-CHAL-01 / FEAT-AUDIT-01).
 */
export async function createChallenge(
  input: CreateChallengeInput,
  hostId: string,
  actor: ActorContext,
) {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    throw new ChallengeValidationError("Challenge title cannot be empty.");
  }

  if (input.startAt.getTime() >= input.endAt.getTime()) {
    throw new ChallengeValidationError(
      "Challenge start date must be strictly before end date.",
    );
  }

  if (!input.teams || input.teams.length === 0) {
    throw new ChallengeValidationError(
      "At least one team must be configured for the challenge.",
    );
  }

  // Determine maxMembers per team based on Law L1 if not explicitly provided
  const configuredTeams = input.teams.map((t, index) => {
    let maxMembers = t.maxMembers ?? null;
    if (input.format === "SOLOS") {
      maxMembers = 1; // Law L1: Solo = 1
    } else if (input.format === "DUOS") {
      maxMembers = 2; // Law L1: Duo = 2
    }
    return {
      name: t.name.trim(),
      color: t.color ?? null,
      iconEmoji: t.iconEmoji ?? null,
      mascotUrl: t.mascotUrl ?? null,
      maxMembers,
      sortOrder: t.sortOrder ?? index,
    };
  });

  return prisma.$transaction(async (tx) => {
    const challenge = await tx.challenge.create({
      data: {
        title: trimmedTitle,
        format: input.format,
        status: "UPCOMING",
        startAt: input.startAt,
        endAt: input.endAt,
        punishmentPfpUrl: input.punishmentPfpUrl?.trim() || null,
        hostId,
        teams: {
          create: configuredTeams,
        },
      },
      include: {
        teams: { orderBy: { sortOrder: "asc" } },
      },
    });

    await createAuditEntry(
      {
        actorId: actor.id,
        actorUsername: actor.username,
        actionType: "CHALLENGE_CREATED",
        targetEntityId: challenge.id,
        targetEntityType: "CHALLENGE",
        newValue: {
          id: challenge.id,
          title: challenge.title,
          format: challenge.format,
          teams: challenge.teams.map((t) => t.name),
        },
        auditReason: `Created challenge "${challenge.title}" in ${challenge.format} format.`,
      },
      tx,
    );

    return challenge;
  });
}

/**
 * Manually kicks off a challenge: UPCOMING -> ACTIVE (FEAT-CHAL-02).
 * Locks all declared weekly goals and target hours.
 */
export async function kickoffChallenge(
  challengeId: string,
  actor: ActorContext,
) {
  return prisma.$transaction(async (tx) => {
    const challenge = await tx.challenge.findUnique({
      where: { id: challengeId },
      include: {
        teams: true,
        participants: true,
      },
    });

    if (!challenge) {
      throw new ChallengeValidationError("Challenge not found.");
    }

    assertKickoffPrerequisites({
      teamsCount: challenge.teams.length,
      participantsCount: challenge.participants.length,
    });

    assertChallengeTransition(challenge.status, "ACTIVE");

    const updated = await tx.challenge.update({
      where: { id: challengeId },
      data: { status: "ACTIVE" },
      include: {
        teams: true,
        participants: true,
      },
    });

    await createAuditEntry(
      {
        actorId: actor.id,
        actorUsername: actor.username,
        actionType: "CHALLENGE_KICKOFF",
        targetEntityId: challenge.id,
        targetEntityType: "CHALLENGE",
        previousValue: { status: challenge.status },
        newValue: { status: "ACTIVE" },
        auditReason: `Host manually triggered kickoff for "${challenge.title}".`,
      },
      tx,
    );

    return updated;
  });
}

/**
 * Freezes challenge results and executes dual-failure punishment evaluation (FEAT-CHAL-05).
 * ACTIVE -> COMPLETED
 */
export async function finalizeChallenge(
  challengeId: string,
  actor: ActorContext,
) {
  return prisma.$transaction(async (tx) => {
    const challenge = await tx.challenge.findUnique({
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
      throw new ChallengeValidationError("Challenge not found.");
    }

    assertChallengeTransition(challenge.status, "COMPLETED");

    // Evaluate dual-failure punishment for all participants (Law L6)
    for (const p of challenge.participants) {
      const loggedSeconds = sumLoggedSeconds(p.dailyStudyLogs);
      const goals = p.weeklyGoals.map((g) => ({ completed: g.completed }));
      const evaluation = evaluateParticipantPunishment(
        p.targetSeconds,
        loggedSeconds,
        goals,
      );

      // Upsert PunishmentRecord
      await tx.punishmentRecord.upsert({
        where: { participantId: p.id },
        create: {
          challengeId,
          participantId: p.id,
          isPunished: evaluation.isPunished,
          hoursDeficitSeconds: evaluation.hoursDeficitSeconds,
          incompleteGoalsCount: evaluation.incompleteGoals,
        },
        update: {
          isPunished: evaluation.isPunished,
          hoursDeficitSeconds: evaluation.hoursDeficitSeconds,
          incompleteGoalsCount: evaluation.incompleteGoals,
        },
      });

      // Update participant status if punished and not excused
      if (evaluation.isPunished && p.status !== "EXCUSED") {
        await tx.challengeParticipant.update({
          where: { id: p.id },
          data: { status: "PUNISHED" },
        });
      }
    }

    const updated = await tx.challenge.update({
      where: { id: challengeId },
      data: { status: "COMPLETED" },
    });

    await createAuditEntry(
      {
        actorId: actor.id,
        actorUsername: actor.username,
        actionType: "CHALLENGE_LOCKED",
        targetEntityId: challenge.id,
        targetEntityType: "CHALLENGE",
        previousValue: { status: challenge.status },
        newValue: { status: "COMPLETED" },
        auditReason: `Host finalized results for "${challenge.title}". Evaluated dual-failure punishments.`,
      },
      tx,
    );

    return updated;
  });
}

export interface EnrollParticipantInput {
  challengeId: string;
  userId: string;
  teamId: string;
  targetSeconds?: number;
}

/**
 * Enrolls a user into a challenge team with capacity and duplicate validation.
 */
export async function enrollParticipant(
  input: EnrollParticipantInput,
  actor: ActorContext,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new ChallengeValidationError("User not found.");
    }

    const challenge = await tx.challenge.findUnique({
      where: { id: input.challengeId },
      include: { teams: true },
    });
    if (!challenge) {
      throw new ChallengeValidationError("Challenge not found.");
    }

    const team = challenge.teams.find((t) => t.id === input.teamId);
    if (!team) {
      throw new ChallengeValidationError(
        "Specified team does not belong to this challenge.",
      );
    }

    // Check duplicate enrollment
    const existing = await tx.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId: input.challengeId,
          userId: input.userId,
        },
      },
    });
    if (existing) {
      throw new ChallengeValidationError(
        "User is already enrolled in this challenge.",
      );
    }

    // Check team capacity if capped (e.g. Solo = 1, Duo = 2)
    if (team.maxMembers !== null) {
      const currentMembers = await tx.challengeParticipant.count({
        where: { teamId: team.id },
      });
      if (currentMembers >= team.maxMembers) {
        throw new ChallengeValidationError(
          `Team "${team.name}" has reached its maximum capacity of ${team.maxMembers} member(s).`,
        );
      }
    }

    const participant = await tx.challengeParticipant.create({
      data: {
        challengeId: input.challengeId,
        userId: input.userId,
        teamId: input.teamId,
        targetSeconds: input.targetSeconds ?? 0,
      },
      include: {
        user: true,
        team: true,
      },
    });

    await createAuditEntry(
      {
        actorId: actor.id,
        actorUsername: actor.username,
        actionType: "PARTICIPANT_ENROLLED",
        targetEntityId: participant.id,
        targetEntityType: "PARTICIPANT",
        newValue: {
          userId: user.id,
          username: user.username ?? user.name,
          teamName: team.name,
        },
        auditReason: `Enrolled ${user.displayName ?? user.name} into team "${team.name}".`,
      },
      tx,
    );

    return participant;
  });
}

/**
 * Renames a Duo team (FEAT-CHAL-06).
 */
export async function renameDuoTeam(
  teamId: string,
  newName: string,
  actor: ActorContext,
  reason?: string,
  challengeId?: string,
) {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new ChallengeValidationError("Team name cannot be empty.");
  }

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new ChallengeValidationError("Team not found.");
    }
    if (challengeId && team.challengeId !== challengeId) {
      throw new ChallengeValidationError("Specified team does not belong to this challenge.");
    }

    const updated = await tx.team.update({
      where: { id: teamId },
      data: { name: trimmed },
    });

    await createAuditEntry(
      {
        actorId: actor.id,
        actorUsername: actor.username,
        actionType: "DUO_RENAMED",
        targetEntityId: teamId,
        targetEntityType: "TEAM",
        previousValue: { name: team.name },
        newValue: { name: trimmed },
        auditReason: reason ?? `Renamed team to "${trimmed}".`,
      },
      tx,
    );

    return updated;
  });
}

export async function findAllChallenges() {
  return prisma.challenge.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      host: true,
      teams: { orderBy: { sortOrder: "asc" } },
      _count: {
        select: { participants: true },
      },
    },
  });
}

export async function findChallengeForAdmin(challengeId: string) {
  return prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      host: true,
      teams: {
        orderBy: { sortOrder: "asc" },
      },
      participants: {
        include: {
          user: true,
          team: true,
          dailyStudyLogs: {
            orderBy: { logDate: "asc" },
          },
          weeklyGoals: {
            orderBy: { sortOrder: "asc" },
          },
          punishmentRecord: true,
        },
      },
    },
  });
}

