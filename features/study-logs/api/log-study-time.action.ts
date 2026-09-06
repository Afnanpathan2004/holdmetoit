"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ParticipantAccessError, requireOwnedParticipant } from "@/features/auth/api/require-participant";
import { AuthError, requireSessionUser } from "@/features/auth/api/require-session";
import { canLogStudyTime } from "@/features/declarations/domain/declaration-lock";
import { upsertDailyStudyLog } from "@/features/study-logs/data/daily-study-log.repository";
import {
  composeDurationSeconds,
  validateDailyLogDurationSeconds,
} from "@/features/study-logs/domain/daily-log.validation";

const logStudyTimeSchema = z.object({
  challengeId: z.string().min(1),
  participantId: z.string().optional(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.number().int().min(0).max(24),
  minutes: z.number().int().min(0).max(59),
  seconds: z.number().int().min(0).max(59),
});

export type ActionResult =
  | { ok: true; error?: undefined; code?: undefined; message?: undefined }
  | { ok: false; code: string; message: string; error?: string };

export async function logStudyTimeAction(
  input: z.infer<typeof logStudyTimeSchema>,
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = logStudyTimeSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Please enter a valid study duration.",
      };
    }

    const participant = await requireOwnedParticipant(
      user.id,
      parsed.data.challengeId,
    );

    if (!canLogStudyTime(participant.challenge.status)) {
      return {
        ok: false,
        code: "CHALLENGE_NOT_ACTIVE",
        message: "Study logging is only available during active challenges.",
      };
    }

    const durationSeconds = composeDurationSeconds(
      parsed.data.hours,
      parsed.data.minutes,
      parsed.data.seconds,
    );

    const validation = validateDailyLogDurationSeconds(durationSeconds);
    if (!validation.ok) {
      return {
        ok: false,
        code: validation.code,
        message: validation.message,
      };
    }

    await upsertDailyStudyLog({
      participantId: participant.id,
      logDate: parsed.data.logDate,
      durationSeconds,
    });

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, code: "UNAUTHORIZED", message: error.message };
    }

    if (error instanceof ParticipantAccessError) {
      return { ok: false, code: "NOT_ENROLLED", message: error.message };
    }

    return {
      ok: false,
      code: "PERSISTENCE_ERROR",
      message: "Could not save your study time. Please try again.",
    };
  }
}

