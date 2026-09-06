/**
 * Isomorphic credentials constants for local development demo testing.
 * Safe to import in both client and server components.
 */
export const DEMO_CREDENTIALS = {
  email: "demo@holdmetoit.local",
  password: "HoldMeToIt123!",
  displayName: "Demo Admin",
  role: "ADMIN" as const,
};
