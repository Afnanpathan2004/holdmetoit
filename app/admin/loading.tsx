export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 w-full rounded-2xl bg-cafe-card/60" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-28 rounded-2xl bg-cafe-card/60" />
        <div className="h-28 rounded-2xl bg-cafe-card/60" />
        <div className="h-28 rounded-2xl bg-cafe-card/60" />
      </div>
      <div className="h-72 rounded-3xl bg-cafe-card/60" />
    </div>
  );
}
