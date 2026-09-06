import type { CockpitViewModel } from "@/features/study-logs/data/cockpit-data";
import { WeeklyGoalsPanel } from "@/features/declarations/presentation/weekly-goals-panel";
import { CatchUpCard } from "@/features/study-logs/presentation/catch-up-card";
import { StudyDeskLog } from "@/features/study-logs/presentation/study-desk-log";

interface ParticipantCockpitProps {
  cockpit: CockpitViewModel;
}

export function ParticipantCockpit({ cockpit }: ParticipantCockpitProps) {
  const progressPercent =
    cockpit.targetSeconds > 0
      ? Math.min(
          100,
          Math.round((cockpit.totalLoggedSeconds / cockpit.targetSeconds) * 100),
        )
      : 0;

  const displayName =
    cockpit.participant.displayName ||
    cockpit.participant.username ||
    "Participant";
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Cockpit Header with Participant Identity & Challenge Context */}
      <header className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {cockpit.participant.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cockpit.participant.image}
                alt={displayName}
                className="h-12 w-12 rounded-full border border-cafe-border object-cover"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border border-cafe-honey/40 bg-cafe-elevated font-serif text-lg font-semibold text-cafe-honey-light"
                aria-hidden="true"
              >
                {avatarFallback}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium text-cafe-parchment">{displayName}</h2>
                {cockpit.participant.username ? (
                  <span className="text-xs text-cafe-ash">
                    @{cockpit.participant.username}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-cafe-oatmeal">
                {cockpit.teamIcon ? `${cockpit.teamIcon} ` : ""}
                <span className="text-cafe-linen">{cockpit.teamName}</span>
                <span className="mx-2 text-cafe-ash">·</span>
                <span>{cockpit.challengeTitle}</span>
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <StatusBadge status={cockpit.challengeStatus} />
          </div>
        </div>

        {/* Weekly Target Progress Meter */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-cafe-oatmeal">
            <span>
              Weekly Progress:{" "}
              <span className="font-mono font-mono-tabular text-cafe-parchment">
                {cockpit.totalLoggedClock}
              </span>{" "}
              /{" "}
              <span className="font-mono font-mono-tabular text-cafe-linen">
                {cockpit.targetClock}
              </span>
            </span>
            <span className="font-mono font-mono-tabular text-cafe-honey-light">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-cafe-border bg-cafe-wood">
            <div
              className="h-full rounded-full bg-cafe-honey transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Key Daily & Weekly Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-cafe-border/60 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] text-cafe-ash">Today&apos;s Study Time</p>
            <p className="mt-0.5 font-mono text-base font-mono-tabular text-cafe-parchment">
              {cockpit.todayLoggedClock}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-cafe-ash">Total Logged</p>
            <p className="mt-0.5 font-mono text-base font-mono-tabular text-cafe-linen">
              {cockpit.totalLoggedClock}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[11px] text-cafe-ash">Weekly Target</p>
            <p className="mt-0.5 font-mono text-base font-mono-tabular text-cafe-oatmeal">
              {cockpit.targetClock}
            </p>
          </div>
        </div>
      </header>

      <CatchUpCard summary={cockpit.catchUp} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <StudyDeskLog
            challengeId={cockpit.challengeId}
            canLog={cockpit.canLogStudyTime}
            todayDate={cockpit.todayDate}
            logs={cockpit.logs}
          />
        </div>
        <div className="lg:col-span-7">
          <WeeklyGoalsPanel
            challengeId={cockpit.challengeId}
            goals={cockpit.goals}
            targetClock={cockpit.targetClock}
            canEditDeclarations={cockpit.canEditDeclarations}
            canToggleGoals={cockpit.canToggleGoals}
            isReadOnly={cockpit.isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: CockpitViewModel["challengeStatus"];
}) {
  const labels: Record<CockpitViewModel["challengeStatus"], string> = {
    UPCOMING: "Pre-Kickoff",
    ACTIVE: "Active",
    COMPLETED: "Completed",
  };

  const styles: Record<CockpitViewModel["challengeStatus"], string> = {
    UPCOMING: "border-cafe-lavender/40 text-cafe-lavender",
    ACTIVE: "border-cafe-sage/40 text-cafe-sage",
    COMPLETED: "border-cafe-ash/40 text-cafe-ash",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
