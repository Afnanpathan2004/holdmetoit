"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
   ParticipantAccessError,
   requireOwnedParticipant,
} from "@/features/auth/api/require-participant";
import {
   AuthError,
   requireSessionUser,
} from "@/features/auth/api/require-session";
import {
   calculateChallengeStatus,
   canLogStudyTime,
} from "@/features/challenges/domain/challenge-lifecycle";
import { upsertDailyStudyLog } from "@/features/study-logs/data/daily-study-log.repository";
import {
   composeDurationSeconds,
   validateDailyLogDurationSeconds,
} from "@/features/study-logs/domain/daily-log.validation";
import { validateStudyLogChallengeDay } from "@/features/study-logs/domain/challenge-day";
import { cacheTags, invalidateTags } from "@/core/cache";

const logStudyTimeSchema = z
   .object({
      challengeId: z.string().min(1),
      challengeDay: z.number().int().min(1).optional(),
      date: z
         .string()
         .regex(/^\d{4}-\d{2}-\d{2}$/)
         .optional(),
      hours: z.number().int().min(0).max(24),
      minutes: z.number().int().min(0).max(59),
      seconds: z.number().int().min(0).max(59),
   })
   .refine(
      (data) => data.challengeDay !== undefined || data.date !== undefined,
      {
         message: "Either challengeDay or date must be provided.",
         path: ["challengeDay"],
      }
   );

export type ActionResult =
   { ok: true } | { ok: false; code: string; message: string };

export async function logStudyTimeAction(
   input: z.infer<typeof logStudyTimeSchema>
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
         parsed.data.challengeId
      );

      const now = new Date();
      const challengeStatus = calculateChallengeStatus(
         participant.challenge,
         now
      );
      if (!canLogStudyTime(challengeStatus)) {
         return {
            ok: false,
            code: "CHALLENGE_NOT_ACTIVE",
            message:
               "Study logging is only available during active challenges.",
         };
      }

      const dayValidation = validateStudyLogChallengeDay(
         participant.challenge.startAt,
         {
            challengeDay: parsed.data.challengeDay,
            date: parsed.data.date,
         },
         now
      );

      if (!dayValidation.ok) {
         return {
            ok: false,
            code: dayValidation.code,
            message: dayValidation.message,
         };
      }

      const logDate = dayValidation.dateKey;

      const durationSeconds = composeDurationSeconds(
         parsed.data.hours,
         parsed.data.minutes,
         parsed.data.seconds
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
         challengeId: parsed.data.challengeId,
         logDate,
         durationSeconds,
         actor: {
            id: user.id,
            username: user.name || user.displayName || "participant",
            displayName: user.displayName || user.name || null,
            image: user.image || null,
         },
      });

      invalidateTags([
         cacheTags.challengeScoreboard(parsed.data.challengeId),
         cacheTags.participantCockpit(user.id, parsed.data.challengeId),
      ]);

      revalidatePath("/");
      revalidatePath("/dashboard");
      revalidatePath(`/challenge/${parsed.data.challengeId}`);
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
