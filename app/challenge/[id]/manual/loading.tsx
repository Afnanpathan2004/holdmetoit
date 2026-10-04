export default function ManualLeaderboardLoading() {
  return (
    <div
      className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 animate-pulse"
      aria-label="Loading manual leaderboard"
    >
      {/* Header Banner Skeleton */}
      <div className="h-64 rounded-3xl border border-[#262626] bg-[#141414] p-8" />

      {/* Team Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-2xl border border-[#262626] bg-[#141414]" />
        <div className="h-28 rounded-2xl border border-[#262626] bg-[#141414]" />
        <div className="h-28 rounded-2xl border border-[#262626] bg-[#141414]" />
      </div>

      {/* Standings Table Skeleton */}
      <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#141414] p-6">
        <div className="h-6 w-56 rounded-lg bg-[#1c1c1c]" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-full rounded-xl bg-[#1c1c1c]/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
