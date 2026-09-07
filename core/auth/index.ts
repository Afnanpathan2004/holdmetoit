import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/core/db";
import {
  syncUserFromDiscordProfile,
  syncUserRoleFromDiscord,
} from "@/features/auth/data/user.repository";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      authorization: {
        params: {
          scope: "identify",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/",
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!user.id || !account || account.provider !== "discord") {
        return;
      }

      const discordProfile = profile as {
        username?: string;
        global_name?: string | null;
      };

      await syncUserFromDiscordProfile(user.id, {
        providerAccountId: account.providerAccountId,
        username: discordProfile.username,
        globalName: discordProfile.global_name,
        image: user.image,
      });

      await syncUserRoleFromDiscord(user.id, account.providerAccountId);
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.discordId = user.discordId;
        session.user.displayName = user.displayName;
      }

      return session;
    },
  },
});
