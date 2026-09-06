import { prisma } from "@/core/db";
import { requireSessionUser } from "@/features/auth/api/require-session";

export class AdminAccessError extends Error {
  constructor(
    message = "Administrative privileges required to perform this action.",
  ) {
    super(message);
    this.name = "AdminAccessError";
  }
}

/**
 * Enforces server-side authorization for admin / host operations (Law L5 / Section 8).
 * Permits system administrators (role === "ADMIN") or the designated host of the specified challenge.
 */
export async function requireAdminOrHost(challengeId?: string) {
  const user = await requireSessionUser();

  if (user.role === "ADMIN") {
    return user;
  }

  if (challengeId) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { hostId: true },
    });

    if (challenge?.hostId === user.id) {
      return user;
    }
  }

  throw new AdminAccessError();
}

