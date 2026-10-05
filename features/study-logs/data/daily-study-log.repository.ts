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
