"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cafe-bg px-4 py-16 text-cafe-parchment">
      <div className="w-full max-w-md rounded-3xl border border-cafe-border bg-cafe-card p-8 text-center shadow-cafe">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-cafe-terracotta/40 bg-cafe-terracotta-surface text-cafe-terracotta">
          <AlertCircle className="size-6" />
        </div>

        <h1 className="mt-4 font-serif text-xl font-bold text-cafe-parchment sm:text-2xl">
          Something went wrong
        </h1>

        <p className="mt-2 text-xs text-cafe-oatmeal sm:text-sm">
          {error.message ||
            "An unexpected error occurred while loading this page. Please try refreshing or return home."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="min-h-[44px] gap-2"
          >
            <RefreshCw className="size-4" />
            <span>Try Again</span>
          </Button>

          <Button asChild variant="outline" className="min-h-[44px] gap-2">
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

