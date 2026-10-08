import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/db";

export type ChallengeWithTeams = Prisma.ChallengeGetPayload<{
   include: { teams: true };
}>;

export async function findChallengeWithTeamsById(
   challengeId: string
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

export async function findLatestAvailableChallenge(
   now = new Date()
): Promise<ChallengeWithTeams | null> {
   // First check for UPCOMING challenges that participants can enroll in
   const upcoming = await prisma.challenge.findFirst({
      where: { startAt: { gt: now } },
      include: {
         teams: {
            orderBy: { sortOrder: "asc" },
         },
      },
      orderBy: { startAt: "asc" },
   });

   if (upcoming) {
      return upcoming;
   }

   // Fall back to ACTIVE challenge if one is running
   return prisma.challenge.findFirst({
      where: {
         startAt: { lte: now },
         endAt: { gt: now },
      },
      include: {
         teams: {
            orderBy: { sortOrder: "asc" },
         },
      },
      orderBy: { startAt: "desc" },
   });
}
