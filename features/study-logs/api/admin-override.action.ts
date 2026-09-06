"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/features/auth/api/require-admin";
import { executeAdminHoursOverride } from "@/features/study-logs/data/admin-override.repository";
import {
  composeDurationSeconds,
  validateDailyLogDurationSeconds,
} from "@/features/study-logs/domain/daily-log.validation";

const adminOverrideSchema = z.object({
  challengeId: z.string().min(1),
  participantId: z.string().min(1),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.number().int().min(0).max(24),
  minutes: z.number().int().min(0).max(59),
  seconds: z.number().int().min(0).max(59),
  reason: z.string().min(3, "Audit reason must be at least 3 characters."),
});

export type AdminOverrideResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

/**
 * Host manual hours override action (Law L5 / FEAT-LOG-04).
 */
export async function adminOverrideStudyHoursAction(
  input: z.infer<typeof adminOverrideSchema>,
): Promise<AdminOverrideResult> {
  try {
    const admin = await requireAdminUser();
    const parsed = adminOverrideSchema.safeParse(input);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: firstError,
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

    await executeAdminHoursOverride({
      participantId: parsed.data.participantId,
      logDate: parsed.data.logDate,
      durationSeconds,
      reason: parsed.data.reason,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });

    revalidatePath(`/admin/challenges/${parsed.data.challengeId}`);
    revalidatePath(`/admin/challenges/${parsed.data.challengeId}/roster`);
    revalidatePath(`/challenge/${parsed.data.challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "OVERRIDE_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Failed to record manual hours override.",
    };
  }
}
