import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Deterministic seed identifier for idempotent upserts. */
export const SEED_CHALLENGE_ID = "seed-honey-bees-vs-lavender-butterflies";

const SEED_TEAM_BEES_ID = "seed-team-honey-bees";
const SEED_TEAM_BUTTERFLIES_ID = "seed-team-lavender-butterflies";

async function main() {
  const startAt = new Date("2026-09-01T08:00:00.000Z");
  const endAt = new Date("2026-09-08T08:00:00.000Z");

  const challenge = await prisma.challenge.upsert({
    where: { id: SEED_CHALLENGE_ID },
    create: {
      id: SEED_CHALLENGE_ID,
      title: "Midterm Reading Week Sprint",
      format: "TEAM_VS_TEAM",
      status: "UPCOMING",
      startAt,
      endAt,
      punishmentPfpUrl: "/prototype/assets/punishment_pfp.jpg",
    },
    update: {
      title: "Midterm Reading Week Sprint",
      format: "TEAM_VS_TEAM",
      status: "UPCOMING",
      startAt,
      endAt,
      punishmentPfpUrl: "/prototype/assets/punishment_pfp.jpg",
    },
  });

  await prisma.team.upsert({
    where: { id: SEED_TEAM_BEES_ID },
    create: {
      id: SEED_TEAM_BEES_ID,
      challengeId: challenge.id,
      name: "Honey Bees",
      iconEmoji: "🐝",
      color: "#d9822b",
      maxMembers: null,
      sortOrder: 0,
    },
    update: {
      name: "Honey Bees",
      iconEmoji: "🐝",
      color: "#d9822b",
      maxMembers: null,
      sortOrder: 0,
    },
  });

  await prisma.team.upsert({
    where: { id: SEED_TEAM_BUTTERFLIES_ID },
    create: {
      id: SEED_TEAM_BUTTERFLIES_ID,
      challengeId: challenge.id,
      name: "Lavender Butterflies",
      iconEmoji: "🦋",
      color: "#9986b8",
      maxMembers: null,
      sortOrder: 1,
    },
    update: {
      name: "Lavender Butterflies",
      iconEmoji: "🦋",
      color: "#9986b8",
      maxMembers: null,
      sortOrder: 1,
    },
  });

  console.log(
    `Seed complete: challenge "${challenge.title}" (${challenge.id}) with Honey Bees vs Lavender Butterflies.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
