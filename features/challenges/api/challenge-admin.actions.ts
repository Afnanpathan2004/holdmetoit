"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  AdminAccessError,
  requireAdminUser,
} from "@/features/auth/api/require-admin";
import {
  adminEnrollParticipant,
  createAdminChallenge,
  deleteAdminChallenge,
  kickoffChallenge,
  lockChallengeResults,
  reassignParticipantTeam,
  updateAdminChallenge,
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
    revalidatePath("/");

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
    revalidatePath("/");

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

const adminEnrollParticipantSchema = z.object({
  challengeId: z.string().min(1),
  userId: z.string().min(1),
  teamId: z.string().min(1),
  targetSeconds: z.number().int().min(0).default(126000),
  reason: z.string().min(3, "Audit reason must be at least 3 characters."),
});

export async function adminEnrollParticipantAction(
  input: z.infer<typeof adminEnrollParticipantSchema>,
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdminUser();
    const parsed = adminEnrollParticipantSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message ?? "Invalid enrollment data.",
      };
    }

    await adminEnrollParticipant({
      challengeId: parsed.data.challengeId,
      userId: parsed.data.userId,
      teamId: parsed.data.teamId,
      targetSeconds: parsed.data.targetSeconds,
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
    revalidatePath("/");

    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return {
        ok: false,
        code: error.code,
        message: error.message,
      };
    }

    return {
      ok: false,
      code: "ENROLLMENT_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Failed to enroll member in challenge.",
    };
  }
}

const updateChallengeSchema = z.object({
  challengeId: z.string().min(1),
  title: z.string().min(3).max(80),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  punishmentPfpUrl: z.string().optional().nullable(),
  teams: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        color: z.string().optional().nullable(),
        iconEmoji: z.string().optional().nullable(),
        mascotUrl: z.string().optional().nullable(),
      }),
    )
    .min(1),
});

export async function updateChallengeAction(
  input: z.infer<typeof updateChallengeSchema>,
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdminUser();
    const parsed = updateChallengeSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Please check all required fields and team names.",
      };
    }

    if (new Date(parsed.data.endAt) <= new Date(parsed.data.startAt)) {
      return {
        ok: false,
        code: "INVALID_DATES",
        message: "Conclusion date must be strictly after the kickoff date.",
      };
    }

    await updateAdminChallenge(
      parsed.data.challengeId,
      {
        title: parsed.data.title,
        startAt: parsed.data.startAt,
        endAt: parsed.data.endAt,
        punishmentPfpUrl: parsed.data.punishmentPfpUrl,
        teams: parsed.data.teams,
      },
      {
        id: admin.id,
        username: admin.username,
      },
    );

    revalidatePath(`/challenge/${parsed.data.challengeId}`);
    revalidatePath("/admin");
    revalidatePath("/");

    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return {
        ok: false,
        code: error.code,
        message: error.message,
      };
    }

    return {
      ok: false,
      code: "UPDATE_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to update challenge.",
    };
  }
}

const reassignParticipantTeamSchema = z.object({
  challengeId: z.string().min(1),
  participantId: z.string().min(1),
  newTeamId: z.string().min(1),
  reason: z.string().optional(),
});

export async function reassignParticipantTeamAction(
  input: z.infer<typeof reassignParticipantTeamSchema>,
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdminUser();
    const parsed = reassignParticipantTeamSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Invalid team reassignment parameters.",
      };
    }

    await reassignParticipantTeam({
      participantId: parsed.data.participantId,
      newTeamId: parsed.data.newTeamId,
      reason: parsed.data.reason,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });

    revalidatePath(`/challenge/${parsed.data.challengeId}`);
    revalidatePath("/admin");
    revalidatePath("/");

    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return {
        ok: false,
        code: error.code,
        message: error.message,
      };
    }

    return {
      ok: false,
      code: "REASSIGN_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Failed to reassign participant to team.",
    };
  }
}

export async function deleteChallengeAction(
  challengeId: string,
): Promise<AdminActionResult<{ redirectTo: string }>> {
  try {
    const admin = await requireAdminUser();
    if (!challengeId || typeof challengeId !== "string") {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Missing challenge ID.",
      };
    }

    await deleteAdminChallenge(challengeId, {
      id: admin.id,
      username: admin.username,
    });

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      ok: true,
      data: { redirectTo: "/admin" },
    };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return {
        ok: false,
        code: error.code,
        message: error.message,
      };
    }

    return {
      ok: false,
      code: "DELETE_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to delete challenge.",
    };
  }
}


