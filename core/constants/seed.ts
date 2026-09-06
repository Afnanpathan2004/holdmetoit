/**
 * Deterministic seed constants for the local development demo challenge.
 * Corresponds to prisma/seed.ts.
 */
export const SEED_CHALLENGE_ID = "seed-honey-bees-vs-lavender-butterflies";
export const SEED_CHALLENGE_TITLE = "Midterm Reading Week Sprint";
export const SEED_TEAMS = [
  { name: "Honey Bees", emoji: "🐝", color: "#d9822b" },
  { name: "Lavender Butterflies", emoji: "🦋", color: "#9986b8" },
] as const;

