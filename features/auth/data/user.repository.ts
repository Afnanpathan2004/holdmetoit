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

export async function findAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      username: true,
      displayName: true,
      image: true,
      role: true,
    },
  });
}

export interface GoogleProfileInput {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export async function syncUserFromGoogleProfile(
  userId: string,
  profile: GoogleProfileInput,
): Promise<User> {
  const username = profile.email ? profile.email.split("@")[0] : undefined;
  const displayName = profile.name ?? username ?? "Google User";

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: profile.name ?? displayName,
      displayName,
      username: username ?? undefined,
      image: profile.image ?? undefined,
    },
  });
}

export async function getOrCreateDemoUser(): Promise<User> {
  const DEMO_EMAIL = "demo@holdmetoit.local";
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });

  if (existing) {
    if (existing.role !== "ADMIN") {
      return prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN" },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      id: "usr-demo-dev",
      email: DEMO_EMAIL,
      name: "Demo Admin",
      displayName: "Demo Admin",
      username: "demo_admin",
      role: "ADMIN",
    },
  });
}

