import type { ScoreboardTeam } from "@/features/leaderboard/data/scoreboard.repository";

interface TeamFilterTabsProps {
  teams: ScoreboardTeam[];
  selectedTeamId: string | "all";
  onSelectTeam: (teamId: string | "all") => void;
  totalParticipantsCount: number;
}

export function TeamFilterTabs({
  teams,
  selectedTeamId,
  onSelectTeam,
  totalParticipantsCount,
}: TeamFilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter standings by house"
      className="flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        role="tab"
        aria-selected={selectedTeamId === "all"}
        onClick={() => onSelectTeam("all")}
        className={`inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
          selectedTeamId === "all"
            ? "border-cafe-honey bg-cafe-elevated text-cafe-parchment shadow-sm"
            : "border-cafe-border bg-cafe-card text-cafe-oatmeal hover:bg-cafe-wood hover:text-cafe-linen"
        }`}
      >
        All Houses ({totalParticipantsCount})
      </button>

      {teams.map((team) => {
        const isSelected = selectedTeamId === team.id;
        return (
          <button
            key={team.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectTeam(team.id)}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? "border-cafe-honey bg-cafe-elevated text-cafe-parchment shadow-sm"
                : "border-cafe-border bg-cafe-card text-cafe-oatmeal hover:bg-cafe-wood hover:text-cafe-linen"
            }`}
          >
            <span>{team.iconEmoji ?? "🛡️"}</span>
            <span>{team.name}</span>
            <span className="rounded-full bg-cafe-wood px-2 py-0.5 text-xs text-cafe-ash">
              {team.memberCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}

