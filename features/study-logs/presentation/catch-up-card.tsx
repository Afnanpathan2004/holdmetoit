import type { CatchUpSummary } from "@/features/leaderboard/domain/catch-up-presentation";
import { formatSecondsToHuman } from "@/features/study-logs/domain/duration";

interface CatchUpCardProps {
  summary: CatchUpSummary;
}

const TONE_ICONS: Record<CatchUpSummary["tone"], string> = {
  complete: "🌿",
  "catch-up": "☕",
  "on-pace": "🌿",
  deadline: "☕",
};

export function CatchUpCard({ summary }: CatchUpCardProps) {
  const icon = TONE_ICONS[summary.tone];

  return (
    <section
      className="rounded-2xl border border-cafe-sage/40 bg-cafe-sage-surface p-5"
      aria-label="Catch-up reflection"
    >
      <p className="font-script text-lg leading-relaxed text-cafe-linen">
        <span aria-hidden="true">{icon} </span>
        {summary.message}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-cafe-oatmeal">
        <p>
          <span className="text-cafe-ash">Progress:</span>{" "}
          <span className="font-mono font-mono-tabular text-cafe-parchment">
            {summary.progressLabel}
          </span>
        </p>
        {summary.paceSecondsPerDay !== null && summary.deficitSeconds > 0 ? (
          <p>
            <span className="text-cafe-ash">Remaining deficit:</span>{" "}
            <span className="font-mono font-mono-tabular text-cafe-parchment">
              {formatSecondsToHuman(summary.deficitSeconds)}
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
