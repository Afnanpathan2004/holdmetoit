"use server";

import { signIn, signOut } from "@/core/auth";

export async function loginWithDiscordAction(redirectTo?: string) {
  await signIn("discord", { redirectTo: redirectTo || "/dashboard" });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
