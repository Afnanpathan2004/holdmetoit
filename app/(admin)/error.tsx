"use client";

import Link from "next/link";
import { ShieldAlert, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  const isAuthOrAccessError =
    error.name === "AuthError" ||
    error.name === "AdminAccessError" ||
    error.message?.toLowerCase().includes("sign in") ||
    error.message?.toLowerCase().includes("privilege");

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-3xl border border-cafe-terracotta/40 bg-cafe-terracotta-surface p-8 shadow-cafe">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-cafe-terracotta/50 bg-cafe-wood text-cafe-terracotta">
          <ShieldAlert className="size-6" />
        </div>

        <h2 className="mt-4 font-serif text-xl font-bold text-cafe-parchment sm:text-2xl">
          {isAuthOrAccessError
            ? "Administrative Authorization Required"
            : "Admin Area Error"}
        </h2>

        <p className="mt-2 text-sm text-cafe-linen">
          {error.message ||
            "You must be signed in with host or administrator privileges to view this section."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {isAuthOrAccessError ? (
            <Button asChild className="min-h-[44px]">
              <Link href="/api/auth/signin?callbackUrl=/admin">
                Login with Discord
              </Link>
            </Button>
          ) : (
            <Button
              onClick={() => reset()}
              variant="outline"
              className="min-h-[44px] gap-2"
            >
              <RefreshCw className="size-4" />
              <span>Try Again</span>
            </Button>
          )}

          <Button asChild variant="ghost" className="min-h-[44px] gap-2">
            <Link href="/">
              <ArrowLeft className="size-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

