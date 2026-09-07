import { auth } from "@/core/auth";
import { prisma } from "@/core/db";

export class AdminAccessError extends Error {
  readonly code = "FORBIDDEN_NOT_ADMIN";
  constructor(message = "Host administrative permissions required.") {
    super(message);
    this.name = "AdminAccessError";
  }
}

export interface AdminSessionUser {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "PARTICIPANT";
}

export async function requireAdminUser(): Promise<AdminSessionUser> {
  const session = await auth();

  if (session?.user?.id) {
    if (session.user.role === "ADMIN") {
      return {
        id: session.user.id,
        username: session.user.displayName ?? session.user.name ?? "HostAdmin",
        displayName:
          session.user.displayName ?? session.user.name ?? "Host Admin",
        role: "ADMIN",
      };
    }
  }

  throw new AdminAccessError();
}
