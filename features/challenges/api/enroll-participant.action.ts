"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSessionUser } from "@/features/auth/api/require-session";
import { enrollParticipantInChallenge } from "@/features/challenges/data/participant.repository";
import { validateWeeklyTargetSeconds } from "@/features/declarations/domain/weekly-goals.validation";
import { composeDurationSeconds } from "@/features/study-logs/domain/daily-log.validation";

const enrollParticipantSchema = z.object({
  challengeId: z.string().min(1),
  teamId: z.string().min(1),
  hours: z.number().int().min(0).max(105).default(35),
  minutes: z.number().int().min(0).max(59).default(0),
  seconds: z.number().int().min(0).max(59).default(0),
});

export type EnrollActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export async function enrollInChallengeAction(
  input: z.infer<typeof enrollParticipantSchema>,
): Promise<EnrollActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = enrollParticipantSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Please select a valid team and target duration.",
      };
    }

    const targetSeconds = composeDurationSeconds(
      parsed.data.hours,
      parsed.data.minutes,
      parsed.data.seconds,
    );

    const validation = validateWeeklyTargetSeconds(targetSeconds);
    if (!validation.ok) {
      return {
        ok: false,
        code: validation.code,
        message: validation.message,
      };
    }

    await enrollParticipantInChallenge({
      userId: user.id,
      challengeId: parsed.data.challengeId,
      teamId: parsed.data.teamId,
      targetSeconds,
    });

    revalidatePath(`/challenge/${parsed.data.challengeId}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "ENROLLMENT_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to enroll in challenge.",
    };
  }
}
