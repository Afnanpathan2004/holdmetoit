"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminOrHost } from "@/features/auth/api/require-admin";
import { adminOverrideDailyStudyLog } from "@/features/study-logs/data/daily-study-log.repository";

const OverrideSchema = z.object({
  challengeId: z.string().min(1),
  participantId: z.string().min(1),
  logDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  durationSeconds: z
    .number()
    .int()
    .min(0)
    .max(86_400, "Maximum daily hours is 24 (86,400s)"),
  reason: z
    .string()
    .trim()
    .min(3, "A meaningful audit reason (at least 3 characters) is required."),
});

export async function overrideStudyHoursAction(rawInput: unknown) {
  const parsed = OverrideSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid override parameters.",
    };
  }

  const { challengeId, participantId, logDate, durationSeconds, reason } =
    parsed.data;
  const user = await requireAdminOrHost(challengeId);

  try {
    const updated = await adminOverrideDailyStudyLog({
      challengeId,
      participantId,
      logDate,
      durationSeconds,
      reason,
      actor: { id: user.id, username: user.username ?? user.displayName ?? user.name ?? "Host" },
    });

    revalidatePath(`/admin/challenges/${challengeId}/roster`);
    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true as const, logId: updated.id };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Failed to override study hours.",
    };
  }
}
