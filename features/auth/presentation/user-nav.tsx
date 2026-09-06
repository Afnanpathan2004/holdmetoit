"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export interface UserNavUser {
  id?: string;
  name?: string | null;
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "ADMIN" | "PARTICIPANT" | string;
}

interface UserNavProps {
  user?: UserNavUser | null;
  loginCallbackUrl?: string;
}

export function UserNav({ user, loginCallbackUrl }: UserNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user?.id) {
    const loginHref = loginCallbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`
      : "/login";

    return (
      <Button asChild size="sm" className="min-h-[38px] text-xs gap-1.5 font-semibold">
        <Link href={loginHref}>
          <LogIn className="size-3.5" />
          <span>Log in</span>
        </Link>
      </Button>
    );
  }

  const displayName = user.displayName ?? user.name ?? user.username ?? "Participant";
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const isAdmin = user.role === "ADMIN";

  async function handleSignOut() {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="flex items-center gap-2">
      {/* Identity Pill */}
      <div className="flex items-center gap-2.5 rounded-xl border border-cafe-border bg-cafe-card px-3 py-1.5 text-xs shadow-sm">
        {user.image ? (
          <img
            src={user.image}
            alt={displayName}
            className="size-6 rounded-full border border-cafe-border object-cover"
          />
        ) : (
          <div className="flex size-6 items-center justify-center rounded-full bg-cafe-elevated text-[11px] font-bold text-cafe-honey">
            {initial}
          </div>
        )}

        <div className="hidden sm:block text-left leading-tight">
          <p className="font-medium text-cafe-parchment truncate max-w-[140px]">
            {displayName}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-cafe-oatmeal">
            {isAdmin ? (
              <span className="flex items-center gap-0.5 text-cafe-honey-light font-semibold uppercase tracking-wider">
                <ShieldCheck className="size-2.5" />
                <span>Admin</span>
              </span>
            ) : (
              <span className="uppercase tracking-wider">Member</span>
            )}
          </div>
        </div>
      </div>

      {/* Log Out Action */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isLoggingOut}
        className="min-h-[38px] text-xs gap-1 text-cafe-oatmeal hover:text-cafe-terracotta hover:bg-cafe-terracotta-surface/30 px-2.5 transition-colors"
        aria-label="Log out of account"
      >
        {isLoggingOut ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <LogOut className="size-3.5" />
        )}
        <span className="hidden md:inline">Log out</span>
      </Button>
    </div>
  );
}

