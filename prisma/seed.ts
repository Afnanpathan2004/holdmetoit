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

  // Seed local development demo account (ADMIN)
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@holdmetoit.local" },
    create: {
      id: "usr-demo-dev",
      email: "demo@holdmetoit.local",
      name: "Demo Admin",
      displayName: "Demo Admin",
      username: "demo_admin",
      role: "ADMIN",
    },
    update: {
      role: "ADMIN",
      name: "Demo Admin",
      displayName: "Demo Admin",
    },
  });

  // Enroll demo user into Honey Bees team
  const demoParticipant = await prisma.challengeParticipant.upsert({
    where: {
      challengeId_userId: {
        challengeId: challenge.id,
        userId: demoUser.id,
      },
    },
    create: {
      id: "part-demo-bees",
      challengeId: challenge.id,
      userId: demoUser.id,
      teamId: SEED_TEAM_BEES_ID,
      targetSeconds: 25 * 3600, // 25:00:00
      status: "NORMAL",
    },
    update: {
      teamId: SEED_TEAM_BEES_ID,
      targetSeconds: 25 * 3600,
    },
  });

  // Seed demo weekly goals
  const demoGoals = [
    "Complete Algorithms Problem Set 4",
    "Finish Operating Systems Chapter 5",
    "Review HoldMeToIt Domain Math Tests",
  ];

  for (let i = 0; i < demoGoals.length; i++) {
    await prisma.weeklyGoal.upsert({
      where: { id: `goal-demo-${i + 1}` },
      create: {
        id: `goal-demo-${i + 1}`,
        participantId: demoParticipant.id,
        description: demoGoals[i],
        sortOrder: i,
        completed: i === 0,
      },
      update: {
        description: demoGoals[i],
        sortOrder: i,
      },
    });
  }

  // Seed an initial daily study log (3h 45m = 13500s)
  await prisma.dailyStudyLog.upsert({
    where: {
      participantId_logDate: {
        participantId: demoParticipant.id,
        logDate: new Date("2026-09-02T00:00:00.000Z"),
      },
    },
    create: {
      id: "log-demo-day-1",
      participantId: demoParticipant.id,
      logDate: new Date("2026-09-02T00:00:00.000Z"),
      durationSeconds: 13500,
      isOverride: false,
    },
    update: {
      durationSeconds: 13500,
    },
  });

  console.log(
    `Seed complete: challenge "${challenge.title}" (${challenge.id}) with Honey Bees vs Lavender Butterflies and Demo User (${demoUser.email}).`,
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
