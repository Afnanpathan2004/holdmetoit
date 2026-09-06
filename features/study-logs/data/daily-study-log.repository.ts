import { prisma } from "@/core/db";

function toUtcDateOnly(dateInput: string | Date): Date {
  if (typeof dateInput === "string") {
    const [year, month, day] = dateInput.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  return new Date(
    Date.UTC(
      dateInput.getUTCFullYear(),
      dateInput.getUTCMonth(),
      dateInput.getUTCDate(),
    ),
  );
}

export async function upsertDailyStudyLog(params: {
  participantId: string;
  logDate: string | Date;
  durationSeconds: number;
}) {
  const logDate = toUtcDateOnly(params.logDate);

  return prisma.dailyStudyLog.upsert({
    where: {
      participantId_logDate: {
        participantId: params.participantId,
        logDate,
      },
    },
    create: {
      participantId: params.participantId,
      logDate,
      durationSeconds: params.durationSeconds,
    },
    update: {
      durationSeconds: params.durationSeconds,
      isOverride: false,
      overrideById: null,
      overrideReason: null,
    },
  });
}

export async function findDailyLog(
  participantId: string,
  logDate: string | Date,
) {
  const normalized = toUtcDateOnly(logDate);

  return prisma.dailyStudyLog.findUnique({
    where: {
      participantId_logDate: {
        participantId,
        logDate: normalized,
      },
    },
  });
}

/**
 * Admin inline hours override with audit entry (FEAT-LOG-04 / Law L5).
 */
export async function adminOverrideDailyStudyLog(params: {
  challengeId?: string;
  participantId: string;
  logDate: string | Date;
  durationSeconds: number;
  reason: string;
  actor: { id: string; username: string };
}) {
  const trimmedReason = params.reason.trim();
  if (!trimmedReason) {
    throw new Error("Audit reason is required for hours override.");
  }

  if (
    !Number.isInteger(params.durationSeconds) ||
    params.durationSeconds < 0 ||
    params.durationSeconds > 86_400
  ) {
    throw new Error(
      "Duration must be an integer between 0 and 86,400 seconds (24 hours).",
    );
  }

  const logDate = toUtcDateOnly(params.logDate);

  return prisma.$transaction(async (tx) => {
    if (params.challengeId) {
      const participant = await tx.challengeParticipant.findUnique({
        where: { id: params.participantId },
        select: { challengeId: true },
      });
      if (!participant) {
        throw new Error("Participant not found.");
      }
      if (participant.challengeId !== params.challengeId) {
        throw new Error("Participant does not belong to this challenge.");
      }
    }

    const existing = await tx.dailyStudyLog.findUnique({
      where: {
        participantId_logDate: {
          participantId: params.participantId,
          logDate,
        },
      },
    });

    const updated = await tx.dailyStudyLog.upsert({
      where: {
        participantId_logDate: {
          participantId: params.participantId,
          logDate,
        },
      },
      create: {
        participantId: params.participantId,
        logDate,
        durationSeconds: params.durationSeconds,
        isOverride: true,
        overrideById: params.actor.id,
        overrideReason: trimmedReason,
      },
      update: {
        durationSeconds: params.durationSeconds,
        isOverride: true,
        overrideById: params.actor.id,
        overrideReason: trimmedReason,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actor.id,
        actorUsername: params.actor.username,
        actionType: "HOURS_OVERRIDE",
        targetEntityId: updated.id,
        targetEntityType: "DAILY_STUDY_LOG",
        previousValue: existing
          ? JSON.stringify({ durationSeconds: existing.durationSeconds })
          : null,
        newValue: JSON.stringify({
          durationSeconds: updated.durationSeconds,
          isOverride: true,
        }),
        auditReason: trimmedReason,
      },
    });

    return updated;
  });
}

