"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthError } from "@/features/auth/api/require-session";
import { ParticipantAccessError, requireOwnedParticipant } from "@/features/auth/api/require-participant";
import { requireSessionUser } from "@/features/auth/api/require-session";
import {
  replaceWeeklyGoals,
  setWeeklyGoalCompleted,
  updateParticipantTargetSeconds,
} from "@/features/declarations/data/weekly-goal.repository";
import { canEditDeclarations } from "@/features/declarations/domain/declaration-lock";
import {
  validateWeeklyGoalDescriptions,
  validateWeeklyTargetSeconds,
} from "@/features/declarations/domain/weekly-goals.validation";
import { parseDurationToSeconds } from "@/features/study-logs/domain/duration";
import type { ActionResult } from "@/features/study-logs/api/log-study-time.action";

const saveDeclarationsSchema = z.object({
  challengeId: z.string().min(1),
  targetClock: z.string().min(1),
  goals: z.array(z.string()).min(1).max(10),
});

export async function saveDeclarationsAction(
  input: z.infer<typeof saveDeclarationsSchema>,
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = saveDeclarationsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Please check your declarations and try again.",
      };
    }

    const participant = await requireOwnedParticipant(
      user.id,
      parsed.data.challengeId,
    );

    if (!canEditDeclarations(participant.challenge.status)) {
      return {
        ok: false,
        code: "DECLARATIONS_LOCKED",
        message: "Declarations are locked after event kickoff.",
      };
    }

    let targetSeconds: number;
    try {
      targetSeconds = parseDurationToSeconds(parsed.data.targetClock);
    } catch {
      return {
        ok: false,
        code: "INVALID_TARGET",
        message: "Weekly target must use HH:MM:SS format.",
      };
    }

    const targetValidation = validateWeeklyTargetSeconds(targetSeconds);
    if (!targetValidation.ok) {
      return {
        ok: false,
        code: targetValidation.code,
        message: targetValidation.message,
      };
    }

    const goalsValidation = validateWeeklyGoalDescriptions(parsed.data.goals);
    if (!goalsValidation.ok) {
      return {
        ok: false,
        code: goalsValidation.code,
        message: goalsValidation.message,
      };
    }

    await updateParticipantTargetSeconds(participant.id, targetSeconds);
    await replaceWeeklyGoals(
      participant.id,
      parsed.data.goals.map((goal) => goal.trim()),
    );

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
      message: "Could not save declarations. Please try again.",
    };
  }
}

const toggleGoalSchema = z.object({
  challengeId: z.string().min(1),
  goalId: z.string().min(1),
  completed: z.boolean(),
});

export async function toggleWeeklyGoalAction(
  input: z.infer<typeof toggleGoalSchema>,
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = toggleGoalSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Could not update that goal.",
      };
    }

    const participant = await requireOwnedParticipant(
      user.id,
      parsed.data.challengeId,
    );

    if (participant.challenge.status !== "ACTIVE") {
      return {
        ok: false,
        code: "GOALS_LOCKED",
        message: "Goal completion can only be updated during active challenges.",
      };
    }

    const updated = await setWeeklyGoalCompleted(
      participant.id,
      parsed.data.goalId,
      parsed.data.completed,
    );

    if (!updated) {
      return {
        ok: false,
        code: "GOAL_NOT_FOUND",
        message: "That goal could not be found.",
      };
    }

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
      message: "Could not update goal completion.",
    };
  }
}
