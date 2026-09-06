import { auth } from "@/core/auth";

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

  // In local development/demo mode when Discord credentials are not provisioned,
  // provide a local host identity so admin wizard and override tools can be tested and verified.
  if (process.env.NODE_ENV === "development" || !process.env.AUTH_DISCORD_ID) {
    return {
      id: "dev-host-admin",
      username: "DevHostMod",
      displayName: "Development Host",
      role: "ADMIN",
    };
  }

  throw new AdminAccessError();
}
