import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/db";

export type ChallengeWithTeams = Prisma.ChallengeGetPayload<{
  include: { teams: true };
}>;

export async function findChallengeWithTeamsById(
  challengeId: string,
): Promise<ChallengeWithTeams | null> {
  return prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      teams: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}
