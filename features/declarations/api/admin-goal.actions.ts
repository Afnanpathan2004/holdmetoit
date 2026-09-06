"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminOrHost } from "@/features/auth/api/require-admin";
import {
  adminAddGoal,
  adminEditGoal,
  adminToggleGoalCompletion,
} from "@/features/declarations/data/weekly-goal.repository";

const EditGoalSchema = z.object({
  challengeId: z.string().min(1),
  goalId: z.string().min(1),
  description: z.string().trim().min(1, "Goal description cannot be empty."),
  reason: z.string().trim().min(3, "Audit reason is required."),
});

export async function adminEditGoalAction(rawInput: unknown) {
  const parsed = EditGoalSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid goal edit parameters.",
    };
  }

  const { challengeId, goalId, description, reason } = parsed.data;
  const user = await requireAdminOrHost(challengeId);

  try {
    const updated = await adminEditGoal({
      challengeId,
      goalId,
      description,
      reason,
      actor: { id: user.id, username: user.username ?? user.displayName ?? user.name ?? "Host" },
    });

    revalidatePath(`/admin/challenges/${challengeId}/roster`);
    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true as const, goalId: updated.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to edit goal.",
    };
  }
}

const ToggleGoalSchema = z.object({
  challengeId: z.string().min(1),
  goalId: z.string().min(1),
  completed: z.boolean(),
  reason: z.string().trim().min(3, "Audit reason is required."),
});

export async function adminToggleGoalAction(rawInput: unknown) {
  const parsed = ToggleGoalSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid goal parameters.",
    };
  }

  const { challengeId, goalId, completed, reason } = parsed.data;
  const user = await requireAdminOrHost(challengeId);

  try {
    const updated = await adminToggleGoalCompletion({
      challengeId,
      goalId,
      completed,
      reason,
      actor: { id: user.id, username: user.username ?? user.displayName ?? user.name ?? "Host" },
    });

    revalidatePath(`/admin/challenges/${challengeId}/roster`);
    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true as const, goalId: updated.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update goal.",
    };
  }
}

const AddGoalSchema = z.object({
  challengeId: z.string().min(1),
  participantId: z.string().min(1),
  description: z.string().trim().min(1, "Goal description cannot be empty."),
  reason: z.string().trim().min(3, "Audit reason is required."),
});

export async function adminAddGoalAction(rawInput: unknown) {
  const parsed = AddGoalSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid goal parameters.",
    };
  }

  const { challengeId, participantId, description, reason } = parsed.data;
  const user = await requireAdminOrHost(challengeId);

  try {
    const created = await adminAddGoal({
      challengeId,
      participantId,
      description,
      reason,
      actor: { id: user.id, username: user.username ?? user.displayName ?? user.name ?? "Host" },
    });

    revalidatePath(`/admin/challenges/${challengeId}/roster`);
    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true as const, goalId: created.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to add goal.",
    };
  }
}
