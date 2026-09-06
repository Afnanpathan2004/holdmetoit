import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ChallengeCreatorWizard } from "@/features/challenges/presentation/challenge-creator-wizard";

export default function NewChallengePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cafe-border bg-cafe-card text-cafe-linen hover:bg-cafe-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-cafe-parchment">
            Create Study Challenge
          </h1>
          <p className="text-xs text-cafe-oatmeal">
            Configure format, timetable, thematic team houses, and punishment asset.
          </p>
        </div>
      </div>

      <ChallengeCreatorWizard />
    </div>
  );
}
