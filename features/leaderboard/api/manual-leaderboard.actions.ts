"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSessionUser } from "@/features/auth/api/require-session";
import {
  batchUpsertManualLeaderboardEntries,
  upsertManualLeaderboardEntry,
} from "@/features/leaderboard/data/manual-leaderboard.repository";

const manualLogSchema = z.object({
  challengeId: z.string().min(1),
  userId: z.string().min(1).optional(),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionHours: z.number().min(0).max(24),
});

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; code: string; message: string };

export async function logManualSessionHoursAction(
  input: z.infer<typeof manualLogSchema>,
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = manualLogSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Invalid session hours or slot date.",
      };
    }

    const targetUserId = parsed.data.userId ?? user.id;
    const slotDate = new Date(`${parsed.data.slotDate}T00:00:00.000Z`);

    await upsertManualLeaderboardEntry({
      challengeId: parsed.data.challengeId,
      userId: targetUserId,
      slotDate,
      sessionHours: parsed.data.sessionHours,
    });

    revalidatePath(`/challenge/${parsed.data.challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "ACTION_FAILED",
      message: error instanceof Error ? error.message : "Failed to log session hours.",
    };
  }
}

const batchManualLogSchema = z.object({
  challengeId: z.string().min(1),
  entries: z.array(
    z.object({
      userId: z.string().min(1),
      slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      sessionHours: z.number().min(0).max(24),
    }),
  ),
});

export async function batchLogManualSessionHoursAction(
  input: z.infer<typeof batchManualLogSchema>,
): Promise<ActionResult> {
  try {
    await requireSessionUser();
    const parsed = batchManualLogSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Invalid entries provided.",
      };
    }

    const formattedEntries = parsed.data.entries.map((e) => ({
      userId: e.userId,
      slotDate: new Date(`${e.slotDate}T00:00:00.000Z`),
      sessionHours: e.sessionHours,
    }));

    await batchUpsertManualLeaderboardEntries(
      parsed.data.challengeId,
      formattedEntries,
    );

    revalidatePath(`/challenge/${parsed.data.challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "BATCH_ACTION_FAILED",
      message: error instanceof Error ? error.message : "Failed to batch save entries.",
    };
  }
}
