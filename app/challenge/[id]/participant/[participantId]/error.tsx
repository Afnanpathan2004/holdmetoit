"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/state/error-state";
import { Button } from "@/components/ui/button";
import { captureLogRocketException } from "@/core/observability/logrocket";

export default function ParticipantStatsError({
   error,
   reset,
}: {
   error: Error & { digest?: string };
   reset: () => void;
}) {
   useEffect(() => {
      console.error("[ParticipantStatsError caught by route boundary]:", error);
      captureLogRocketException(error, {
         tags: { boundary: "participant-stats-error" },
         extra: { digest: error.digest ?? "" },
      });
   }, [error]);

   return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4">
         <ErrorState
            title="Couldn't load participant stats"
            message="This profile hit an unexpected error. You can retry, or head back to the leaderboard."
         />
         <Button
            type="button"
            variant="secondary"
            className="min-h-[44px]"
            onClick={reset}
         >
            Try again
         </Button>
      </div>
   );
}
