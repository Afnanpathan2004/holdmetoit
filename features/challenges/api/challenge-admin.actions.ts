"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminOrHost } from "@/features/auth/api/require-admin";
import {
  createChallenge,
  enrollParticipant,
  finalizeChallenge,
  kickoffChallenge,
  renameDuoTeam,
} from "@/features/challenges/data/admin-challenge.repository";
import { parseDurationToSeconds } from "@/features/study-logs/domain/duration";

const CreateTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required."),
  color: z.string().optional().nullable(),
  iconEmoji: z.string().optional().nullable(),
  mascotUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

const CreateChallengeSchema = z.object({
  title: z.string().trim().min(1, "Challenge title is required."),
  format: z.enum(["TEAM_VS_TEAM", "DUOS", "SOLOS"]),
  startAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date."),
  endAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date."),
  punishmentPfpUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  teams: z.array(CreateTeamSchema).min(1, "At least one team must be configured."),
});

export async function createChallengeAction(rawInput: unknown) {
  const user = await requireAdminOrHost();

  const parsed = CreateChallengeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid challenge input.",
    };
  }

  const { title, format, startAt, endAt, punishmentPfpUrl, teams } = parsed.data;

  try {
    const challenge = await createChallenge(
      {
        title,
        format,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        punishmentPfpUrl: punishmentPfpUrl || null,
        teams,
      },
      user.id,
      { id: user.id, username: user.username ?? user.displayName ?? user.name ?? "Host" },
    );

    revalidatePath("/admin");
    return { ok: true as const, challengeId: challenge.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create challenge.",
    };
  }
}

export async function kickoffChallengeAction(challengeId: string) {
  const user = await requireAdminOrHost(challengeId);

  try {
    const updated = await kickoffChallenge(challengeId, {
      id: user.id,
      username: user.username ?? user.displayName ?? user.name ?? "Host",
    });

    revalidatePath(`/admin`);
    revalidatePath(`/admin/challenges/${challengeId}`);
    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true as const, status: updated.status };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to start challenge.",
    };
  }
}

export async function finalizeChallengeAction(challengeId: string) {
  const user = await requireAdminOrHost(challengeId);

  try {
    const updated = await finalizeChallenge(challengeId, {
      id: user.id,
      username: user.username ?? user.displayName ?? user.name ?? "Host",
    });

    revalidatePath(`/admin`);
    revalidatePath(`/admin/challenges/${challengeId}`);
    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true as const, status: updated.status };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to lock challenge results.",
    };
  }
}

const EnrollParticipantSchema = z.object({
  challengeId: z.string().min(1),
  userId: z.string().min(1, "User is required."),
  teamId: z.string().min(1, "Team is required."),
  targetClock: z.string().optional(),
});

export async function enrollParticipantAction(rawInput: unknown) {
  const parsed = EnrollParticipantSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid enrollment input.",
    };
  }

  const { challengeId, userId, teamId, targetClock } = parsed.data;
  const user = await requireAdminOrHost(challengeId);

  let targetSeconds = 0;
  if (targetClock && targetClock.trim().length > 0) {
    try {
      targetSeconds = parseDurationToSeconds(targetClock);
    } catch {
      return { ok: false as const, error: "Invalid target clock format. Use HH:MM:SS." };
    }
  }

  try {
    const participant = await enrollParticipant(
      { challengeId, userId, teamId, targetSeconds },
      { id: user.id, username: user.username ?? user.displayName ?? user.name ?? "Host" },
    );

    revalidatePath(`/admin/challenges/${challengeId}`);
    revalidatePath(`/admin/challenges/${challengeId}/roster`);
    revalidatePath(`/challenge/${challengeId}`);

    return { ok: true as const, participantId: participant.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to enroll participant.",
    };
  }
}

export async function renameDuoTeamAction(input: {
  challengeId: string;
  teamId: string;
  newName: string;
  reason?: string;
}) {
  const user = await requireAdminOrHost(input.challengeId);

  try {
    const updated = await renameDuoTeam(
      input.teamId,
      input.newName,
      { id: user.id, username: user.username ?? user.displayName ?? user.name ?? "Host" },
      input.reason,
      input.challengeId,
    );

    revalidatePath(`/admin/challenges/${input.challengeId}`);
    revalidatePath(`/challenge/${input.challengeId}`);

    return { ok: true as const, teamName: updated.name };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to rename team.",
    };
  }
}
