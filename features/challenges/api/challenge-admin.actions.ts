"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/features/auth/api/require-admin";
import {
  createAdminChallenge,
  kickoffChallenge,
  lockChallengeResults,
} from "@/features/challenges/data/challenge-admin.repository";
import { validateChallengeCreation } from "@/features/challenges/domain/challenge-lifecycle";

const createChallengeSchema = z.object({
  title: z.string().min(3).max(80),
  format: z.enum(["TEAM_VS_TEAM", "DUOS", "SOLOS"]),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  punishmentPfpUrl: z.string().optional().nullable(),
  teams: z
    .array(
      z.object({
        name: z.string().min(1),
        color: z.string().optional().nullable(),
        iconEmoji: z.string().optional().nullable(),
        mascotUrl: z.string().optional().nullable(),
      }),
    )
    .min(1),
});

export type AdminActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; code: string; message: string };

export async function createChallengeAction(
  input: z.infer<typeof createChallengeSchema>,
): Promise<AdminActionResult<{ challengeId: string }>> {
  try {
    const admin = await requireAdminUser();
    const parsed = createChallengeSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Please ensure all challenge fields and dates are filled properly.",
      };
    }

    const validation = validateChallengeCreation(parsed.data);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] ?? "Validation error.";
      return {
        ok: false,
        code: "VALIDATION_FAILED",
        message: firstError,
      };
    }

    const challenge = await createAdminChallenge(parsed.data, {
      id: admin.id,
      username: admin.username,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/challenges");

    return {
      ok: true,
      data: { challengeId: challenge.id },
    };
  } catch (error) {
    return {
      ok: false,
      code: "CREATION_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create challenge event.",
    };
  }
}

export async function kickoffChallengeAction(
  challengeId: string,
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdminUser();
    await kickoffChallenge(challengeId, {
      id: admin.id,
      username: admin.username,
    });

    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath(`/admin/challenges/${challengeId}`);
    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "KICKOFF_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to start event.",
    };
  }
}

export async function lockChallengeResultsAction(
  challengeId: string,
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdminUser();
    await lockChallengeResults(challengeId, {
      id: admin.id,
      username: admin.username,
    });

    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath(`/admin/challenges/${challengeId}`);
    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "LOCK_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Failed to finalize and lock results.",
    };
  }
}
