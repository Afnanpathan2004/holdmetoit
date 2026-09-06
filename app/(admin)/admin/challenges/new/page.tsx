import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { requireAdminOrHost } from "@/features/auth/api/require-admin";
import { ChallengeCreatorForm } from "@/features/challenges/presentation/challenge-creator-form";

export default async function NewChallengePage() {
  await requireAdminOrHost();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb / Back Link */}
      <div>
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-cafe-oatmeal hover:text-cafe-honey-light transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Host Dashboard</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-8">
        <div className="flex items-center gap-2 text-cafe-honey">
          <Sparkles className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider text-cafe-honey-light">
            Challenge Wizard
          </span>
        </div>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-cafe-parchment sm:text-3xl">
          Create Study Challenge
        </h1>
        <p className="mt-1 text-sm text-cafe-oatmeal">
          Configure battle format, time windows, punishment forfeit avatar, and house teams.
          Under Law L1, Solos, Duos, and Team vs Team share mathematical parity.
        </p>
      </div>

      {/* Creator Form */}
      <ChallengeCreatorForm />
    </div>
  );
}

