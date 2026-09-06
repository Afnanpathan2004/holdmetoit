import { prisma } from "@/core/db";

export interface ActorContext {
  id: string;
  username: string;
}

/**
 * Pardons a participant with host reason and audit logging (FEAT-PUN-04).
 * Preserves original punishment record while setting isPardoned = true.
 */
export async function adminPardonParticipant(params: {
  challengeId?: string;
  participantId: string;
  reason: string;
  actor: ActorContext;
}) {
  const trimmedReason = params.reason.trim();
  if (!trimmedReason) {
    throw new Error("Audit reason is required to pardon a participant.");
  }

  return prisma.$transaction(async (tx) => {
    const participant = await tx.challengeParticipant.findUnique({
      where: { id: params.participantId },
      include: { punishmentRecord: true },
    });

    if (!participant) {
      throw new Error("Participant not found.");
    }
    if (params.challengeId && participant.challengeId !== params.challengeId) {
      throw new Error("Participant does not belong to this challenge.");
    }

    const previousPardoned = participant.punishmentRecord?.isPardoned ?? false;

    const punishment = await tx.punishmentRecord.upsert({
      where: { participantId: params.participantId },
      create: {
        challengeId: participant.challengeId,
        participantId: participant.id,
        isPunished: true,
        isPardoned: true,
        pardonReason: trimmedReason,
        pardonedById: params.actor.id,
      },
      update: {
        isPardoned: true,
        pardonReason: trimmedReason,
        pardonedById: params.actor.id,
      },
    });

    await tx.challengeParticipant.update({
      where: { id: params.participantId },
      data: { status: "EXCUSED" },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actor.id,
        actorUsername: params.actor.username,
        actionType: "PARTICIPANT_PARDONED",
        targetEntityId: params.participantId,
        targetEntityType: "PARTICIPANT",
        previousValue: JSON.stringify({
          isPardoned: previousPardoned,
          status: participant.status,
        }),
        newValue: JSON.stringify({
          isPardoned: true,
          status: "EXCUSED",
        }),
        auditReason: trimmedReason,
      },
    });

    return punishment;
  });
}

export async function adminRevokePardon(params: {
  challengeId?: string;
  participantId: string;
  reason: string;
  actor: ActorContext;
}) {
  const trimmedReason = params.reason.trim();
  if (!trimmedReason) {
    throw new Error("Audit reason is required to revoke a pardon.");
  }

  return prisma.$transaction(async (tx) => {
    const participant = await tx.challengeParticipant.findUnique({
      where: { id: params.participantId },
      include: { punishmentRecord: true },
    });

    if (!participant || !participant.punishmentRecord) {
      throw new Error("Participant or punishment record not found.");
    }
    if (params.challengeId && participant.challengeId !== params.challengeId) {
      throw new Error("Participant does not belong to this challenge.");
    }

    const updated = await tx.punishmentRecord.update({
      where: { participantId: params.participantId },
      data: {
        isPardoned: false,
        pardonReason: null,
        pardonedById: null,
      },
    });

    await tx.challengeParticipant.update({
      where: { id: params.participantId },
      data: { status: "PUNISHED" },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actor.id,
        actorUsername: params.actor.username,
        actionType: "PARDON_REVOKED",
        targetEntityId: params.participantId,
        targetEntityType: "PARTICIPANT",
        previousValue: JSON.stringify({
          isPardoned: true,
          status: "EXCUSED",
        }),
        newValue: JSON.stringify({
          isPardoned: false,
          status: "PUNISHED",
        }),
        auditReason: trimmedReason,
      },
    });

    return updated;
  });
}

