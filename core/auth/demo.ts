import type { User } from "next-auth";
import { hashPassword, verifyPassword } from "@/core/auth/password";
import { getOrCreateDemoUser } from "@/features/auth/data/user.repository";
import { DEMO_CREDENTIALS } from "./demo-credentials";

export { DEMO_CREDENTIALS };

// Fixed hash derived for the dummy password
const DEMO_PASSWORD_HASH = hashPassword(DEMO_CREDENTIALS.password);

export interface AuthenticatedDemoUser extends User {
  id: string;
  name: string;
  email: string;
  displayName: string;
  username: string;
  role: "ADMIN" | "PARTICIPANT";
  discordId: string | null;
  image: string | null;
}

/**
 * Authorizes the development demo user with strict environment gating.
 * Unconditionally rejected in production (NODE_ENV !== "development").
 */
export async function authorizeDemoUser(
  credentials?: Record<string, unknown>,
): Promise<AuthenticatedDemoUser | null> {
  // Hard law: Dummy credentials are strictly development-only
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const email = String(credentials.email).trim().toLowerCase();
  const password = String(credentials.password);

  if (email !== DEMO_CREDENTIALS.email.toLowerCase()) {
    return null;
  }

  const isValid = verifyPassword(password, DEMO_PASSWORD_HASH);
  if (!isValid) {
    return null;
  }

  // Attempt to resolve or upsert in the database
  try {
    const user = await getOrCreateDemoUser();
    return {
      id: user.id,
      name: user.name ?? DEMO_CREDENTIALS.displayName,
      email: user.email ?? DEMO_CREDENTIALS.email,
      displayName: user.displayName ?? DEMO_CREDENTIALS.displayName,
      username: user.username ?? "demo_admin",
      role: user.role,
      discordId: user.discordId ?? null,
      image: user.image ?? null,
    };
  } catch {
    // If the database server is not running locally, return deterministic in-memory user
    return {
      id: "usr-demo-dev",
      name: DEMO_CREDENTIALS.displayName,
      email: DEMO_CREDENTIALS.email,
      displayName: DEMO_CREDENTIALS.displayName,
      username: "demo_admin",
      role: "ADMIN",
      discordId: null,
      image: null,
    };
  }
}
