import type { User, UserRole } from "@prisma/client";

import { prisma } from "@/core/db";
import {
  mapDiscordProfileToUserFields,
  type DiscordProfileInput,
} from "@/features/auth/data/discord-profile.mapper";

export async function findUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function findUserByDiscordId(
  discordId: string,
): Promise<User | null> {
  return prisma.user.findUnique({ where: { discordId } });
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

export async function syncUserFromDiscordProfile(
  userId: string,
  profile: DiscordProfileInput,
): Promise<User> {
  const fields = mapDiscordProfileToUserFields(profile);

  return prisma.user.update({
    where: { id: userId },
    data: {
      discordId: fields.discordId,
      username: fields.username,
      displayName: fields.displayName,
      image: fields.image,
      name: fields.displayName,
    },
  });
}

export async function promoteFirstUserToAdminIfNeeded(
  userId: string,
): Promise<UserRole | null> {
  const userCount = await countUsers();
  if (userCount !== 1) {
    return null;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });

  return updated.role;
}

export async function listAllUsersForAdmin() {
  return prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      username: true,
      image: true,
      discordId: true,
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

