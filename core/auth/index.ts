import NextAuth, { type User } from "next-auth";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/core/db";
import {
  promoteFirstUserToAdminIfNeeded,
  syncUserFromDiscordProfile,
  syncUserFromGoogleProfile,
} from "@/features/auth/data/user.repository";
import { authorizeDemoUser } from "@/core/auth/demo";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "holdmetoit-local-development-secret-key-32chars-min"
      : undefined),
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
    Google({
      clientId:
        process.env.GOOGLE_CLIENT_ID ??
        (process.env.NODE_ENV === "development"
          ? "mock-google-client-id"
          : undefined),
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ??
        (process.env.NODE_ENV === "development"
          ? "mock-google-client-secret"
          : undefined),
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        return authorizeDemoUser(
          credentials as Record<string, unknown> | undefined,
        );
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!user.id || !account) {
        return;
      }

      if (account.provider === "discord") {
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

        await promoteFirstUserToAdminIfNeeded(user.id);
      } else if (account.provider === "google") {
        await syncUserFromGoogleProfile(user.id, {
          name: user.name,
          email: user.email,
          image: user.image,
        });

        await promoteFirstUserToAdminIfNeeded(user.id);
      }
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "PARTICIPANT";
        token.discordId = (user as any).discordId ?? null;
        token.displayName = (user as any).displayName ?? user.name ?? "User";
        token.username = (user as any).username ?? null;
      }
      return token;
    },
    session({ session, token, user }) {
      if (session.user) {
        session.user.id = (token?.id as string) ?? user?.id ?? session.user.id;
        session.user.role = (token?.role as any) ?? user?.role ?? "PARTICIPANT";
        session.user.discordId =
          (token?.discordId as string) ?? user?.discordId ?? null;
        session.user.displayName =
          (token?.displayName as string) ??
          user?.displayName ??
          session.user.name ??
          "User";
        session.user.username =
          (token?.username as string) ?? user?.username ?? null;
      }

      return session;
    },
  },
});

