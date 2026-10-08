import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ChallengeCreatorWizard } from "@/features/challenges/presentation/challenge-creator-wizard";

export default function NewChallengePage() {
   return (
      <div className="space-y-6 max-w-4xl mx-auto">
         <div className="flex items-center gap-3">
            <Link
               href="/admin"
               className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#292929] bg-[#141414] text-[#ffffff] hover:bg-[#222222] transition-colors"
            >
               <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
               <h1 className="text-2xl font-bold text-[#ffffff]">
                  Create Study Challenge
               </h1>
               <p className="text-xs text-[#868686]">
                  Configure format, timetable, thematic team houses, and
                  punishment asset.
               </p>
            </div>
         </div>

         <ChallengeCreatorWizard />
      </div>
   );
}
