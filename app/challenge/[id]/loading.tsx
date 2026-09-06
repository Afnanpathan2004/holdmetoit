export default function ScoreboardLoading() {
  return (
    <div
      className="mx-auto max-w-6xl animate-pulse space-y-8 px-4 py-8 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Loading scoreboard"
    >
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-cafe-card" />
          <div className="space-y-1.5">
            <div className="h-5 w-32 rounded bg-cafe-card" />
            <div className="h-3 w-24 rounded bg-cafe-card" />
          </div>
        </div>
        <div className="h-9 w-36 rounded-full bg-cafe-card" />
      </div>

      {/* Top Banner Skeleton */}
      <div className="h-64 rounded-3xl border border-cafe-border bg-cafe-card p-6" />

      {/* Filter Tabs Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 rounded bg-cafe-card" />
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-xl bg-cafe-card" />
          <div className="h-10 w-28 rounded-xl bg-cafe-card" />
        </div>
      </div>

      {/* Standings Table Skeleton */}
      <div className="h-96 rounded-3xl border border-cafe-border bg-cafe-card" />
    </div>
  );
}

