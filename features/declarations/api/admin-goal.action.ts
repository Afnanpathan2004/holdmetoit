"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/features/auth/api/require-admin";
import {
  adminAddGoal,
  adminEditGoal,
} from "@/features/declarations/data/admin-goal.repository";

const adminEditGoalSchema = z.object({
  challengeId: z.string().min(1),
  goalId: z.string().min(1),
  description: z.string().min(1).max(200),
  completed: z.boolean(),
  reason: z.string().min(3, "Audit reason must be at least 3 characters."),
});

const adminAddGoalSchema = z.object({
  challengeId: z.string().min(1),
  participantId: z.string().min(1),
  description: z.string().min(1).max(200),
  reason: z.string().min(3, "Audit reason must be at least 3 characters."),
});

export type AdminGoalResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export async function adminEditGoalAction(
  input: z.infer<typeof adminEditGoalSchema>,
): Promise<AdminGoalResult> {
  try {
    const admin = await requireAdminUser();
    const parsed = adminEditGoalSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message ?? "Invalid goal update.",
      };
    }

    await adminEditGoal({
      goalId: parsed.data.goalId,
      description: parsed.data.description,
      completed: parsed.data.completed,
      reason: parsed.data.reason,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });

    revalidatePath(`/admin/challenges/${parsed.data.challengeId}`);
    revalidatePath(`/challenge/${parsed.data.challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "EDIT_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to update weekly goal.",
    };
  }
}

export async function adminAddGoalAction(
  input: z.infer<typeof adminAddGoalSchema>,
): Promise<AdminGoalResult> {
  try {
    const admin = await requireAdminUser();
    const parsed = adminAddGoalSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message ?? "Invalid goal input.",
      };
    }

    await adminAddGoal({
      participantId: parsed.data.participantId,
      description: parsed.data.description,
      reason: parsed.data.reason,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });

    revalidatePath(`/admin/challenges/${parsed.data.challengeId}`);
    revalidatePath(`/challenge/${parsed.data.challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "ADD_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to add weekly goal.",
    };
  }
}
