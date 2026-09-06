export function CockpitSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded-lg bg-cafe-elevated" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-96 rounded-3xl bg-cafe-card lg:col-span-5" />
        <div className="h-96 rounded-3xl bg-cafe-card lg:col-span-7" />
      </div>
    </div>
  );
}
