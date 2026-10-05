import { prisma } from "@/core/db";
import { recordAuditEvent } from "@/features/audit/data/audit-log.repository";

export async function adminPardonParticipant(params: {
  participantId: string;
  reason: string;
  admin: { id: string; username: string };
}) {
  const participant = await prisma.challengeParticipant.findUnique({
    where: { id: params.participantId },
    include: { punishmentRecord: true },
  });

  if (!participant) {
    throw new Error("Participant not found.");
  }

  return prisma.$transaction(async (tx) => {
    const updatedParticipant = await tx.challengeParticipant.update({
      where: { id: params.participantId },
      data: { status: "EXCUSED" },
    });

    const updatedPunishment = await tx.punishmentRecord.upsert({
      where: { participantId: params.participantId },
      create: {
        challengeId: participant.challengeId,
        participantId: params.participantId,
        isPunished: true,
        isPardoned: true,
        pardonReason: params.reason.trim(),
        pardonedById: params.admin.id,
        hoursDeficitSeconds: 0,
        incompleteGoalsCount: 0,
      },
      update: {
        isPardoned: true,
        pardonReason: params.reason.trim(),
        pardonedById: params.admin.id,
      },
    });

    await recordAuditEvent({
      actorId: params.admin.id,
      actorUsername: params.admin.username,
      actionType: "PARTICIPANT_PARDONED",
      targetEntityId: params.participantId,
      targetEntityType: "PARTICIPANT",
      challengeId: participant.challengeId,
      previousValue: {
        status: participant.status,
        isPardoned: participant.punishmentRecord?.isPardoned ?? false,
      },
      newValue: {
        status: "EXCUSED",
        isPardoned: true,
        pardonReason: params.reason.trim(),
      },
      auditReason: params.reason.trim(),
    });

    return {
      participant: updatedParticipant,
      punishmentRecord: updatedPunishment,
    };
  });
}
