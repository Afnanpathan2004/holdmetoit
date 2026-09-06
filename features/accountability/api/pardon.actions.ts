"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  adminPardonParticipant,
  adminRevokePardon,
} from "@/features/accountability/data/pardon.repository";
import { requireAdminOrHost } from "@/features/auth/api/require-admin";

const PardonSchema = z.object({
  challengeId: z.string().min(1),
  participantId: z.string().min(1),
  reason: z.string().trim().min(3, "Audit reason is required to issue a pardon."),
});

export async function pardonParticipantAction(rawInput: unknown) {
  const parsed = PardonSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid pardon parameters.",
    };
  }

  const { challengeId, participantId, reason } = parsed.data;
  const user = await requireAdminOrHost(challengeId);

  try {
    const updated = await adminPardonParticipant({
      challengeId,
      participantId,
      reason,
      actor: { id: user.id, username: user.username ?? user.displayName ?? user.name ?? "Host" },
    });

    revalidatePath(`/admin/challenges/${challengeId}/roster`);
    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true as const, punishmentId: updated.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to pardon participant.",
    };
  }
}

const RevokePardonSchema = z.object({
  challengeId: z.string().min(1),
  participantId: z.string().min(1),
  reason: z.string().trim().min(3, "Audit reason is required to revoke a pardon."),
});

export async function revokePardonAction(rawInput: unknown) {
  const parsed = RevokePardonSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid revoke parameters.",
    };
  }

  const { challengeId, participantId, reason } = parsed.data;
  const user = await requireAdminOrHost(challengeId);

  try {
    const updated = await adminRevokePardon({
      challengeId,
      participantId,
      reason,
      actor: { id: user.id, username: user.username ?? user.displayName ?? user.name ?? "Host" },
    });

    revalidatePath(`/admin/challenges/${challengeId}/roster`);
    revalidatePath(`/challenge/${challengeId}`);
    revalidatePath("/dashboard");

    return { ok: true as const, punishmentId: updated.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to revoke pardon.",
    };
  }
}
