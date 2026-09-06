import Link from "next/link";
import {
  Calendar,
  Flame,
  Plus,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { listAllChallengesForAdmin } from "@/features/challenges/data/challenge-admin.repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let challenges: Awaited<ReturnType<typeof listAllChallengesForAdmin>> = [];

  try {
    challenges = await listAllChallengesForAdmin();
  } catch (error) {
    // If DB is offline or empty in demo, fallback to empty list
    challenges = [];
  }

  const upcomingCount = challenges.filter((c) => c.status === "UPCOMING").length;
  const activeCount = challenges.filter((c) => c.status === "ACTIVE").length;
  const completedCount = challenges.filter((c) => c.status === "COMPLETED").length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-cafe-border">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cafe-parchment">
            Challenge Management Hub
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-cafe-oatmeal">
            Create, balance, kickoff, and referee study tournaments without spreadsheets.
          </p>
        </div>

        <Link href="/admin/challenges/new">
          <Button className="h-11 min-h-[44px] gap-2 font-semibold shadow-cafe">
            <Plus className="h-4 w-4" />
            <span>+ Create New Challenge</span>
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 shadow-cafe">
          <span className="text-xs text-cafe-ash font-medium uppercase tracking-wider">
            Active Tournaments
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-3xl font-bold text-cafe-honey">
              {activeCount}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-honey/15 text-cafe-honey">
              <Flame className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 shadow-cafe">
          <span className="text-xs text-cafe-ash font-medium uppercase tracking-wider">
            Upcoming Setup
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-3xl font-bold text-cafe-parchment">
              {upcomingCount}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-elevated text-cafe-linen">
              <Calendar className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 shadow-cafe">
          <span className="text-xs text-cafe-ash font-medium uppercase tracking-wider">
            Completed Archive
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-3xl font-bold text-cafe-sage">
              {completedCount}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-sage/15 text-cafe-sage">
              <Trophy className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
        <h2 className="font-serif text-xl font-semibold text-cafe-parchment mb-4">
          All Community Challenges
        </h2>

        {challenges.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-cafe-ash" />
            <h3 className="mt-4 font-serif text-lg font-semibold text-cafe-parchment">
              No Challenges Created Yet
            </h3>
            <p className="mt-1 text-xs text-cafe-oatmeal max-w-sm mx-auto">
              Get started by creating your first community study battle. It only takes 60 seconds.
            </p>
            <div className="mt-6">
              <Link href="/admin/challenges/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Challenge</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-cafe-border/60">
            {challenges.map((c) => (
              <div
                key={c.id}
                className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-cafe-wood/40 rounded-xl px-3 transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                        c.status === "ACTIVE"
                          ? "border-cafe-honey/40 bg-cafe-honey/15 text-cafe-honey"
                          : c.status === "COMPLETED"
                            ? "border-cafe-sage/40 bg-cafe-sage/15 text-cafe-sage"
                            : "border-cafe-border bg-cafe-elevated text-cafe-linen"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="font-mono text-xs text-cafe-ash">
                      {c.format}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
                    {c.title}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-cafe-oatmeal">
                    <span>
                      {new Date(c.startAt).toLocaleDateString()} —{" "}
                      {new Date(c.endAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{c._count?.participants ?? 0} participants</span>
                    <span>•</span>
                    <span>
                      Teams: {c.teams.map((t) => t.name).join(" vs ") || "None"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/admin/challenges/${c.id}`}>
                    <Button
                      variant="secondary"
                      className="min-h-[44px] h-10 gap-1.5 text-xs text-cafe-honey"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Manage Console</span>
                    </Button>
                  </Link>

                  <Link href={`/challenge/${c.id}`}>
                    <Button
                      variant="outline"
                      className="min-h-[44px] h-10 text-xs"
                    >
                      Scoreboard ↗
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
