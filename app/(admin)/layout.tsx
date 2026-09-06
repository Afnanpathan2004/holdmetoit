import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, Coffee, PlusCircle, ArrowLeft } from "lucide-react";

import { auth } from "@/core/auth";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/features/auth/presentation/user-nav";
import { SEED_CHALLENGE_ID } from "@/core/constants/seed";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth().catch(() => null);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="min-h-screen bg-cafe-bg text-cafe-parchment">
      {/* Top Admin Navigation Header */}
      <header className="border-b border-cafe-border bg-cafe-wood/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-cafe-honey/40 bg-cafe-card text-cafe-honey">
              <Shield className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="font-serif text-base font-bold tracking-tight text-cafe-parchment hover:text-cafe-honey-light transition-colors"
                >
                  HoldMeToIt Host Console
                </Link>
                <span className="rounded-full border border-cafe-honey/30 bg-cafe-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cafe-honey-light">
                  {session.user.role ?? "Host"}
                </span>
              </div>
              <p className="text-[11px] text-cafe-oatmeal">
                Challenge Operations & Audit Hub
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 sm:gap-2.5" aria-label="Admin Navigation">
            <Link
              href="/"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-cafe-border bg-cafe-card px-3 py-1.5 text-xs font-medium text-cafe-parchment hover:bg-cafe-elevated transition-colors"
            >
              <span>Home</span>
            </Link>

            <Link
              href="/admin"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-cafe-border bg-cafe-card px-3 py-1.5 text-xs font-medium text-cafe-parchment hover:bg-cafe-elevated transition-colors"
            >
              <span>Challenges</span>
            </Link>

            <Link
              href="/admin/challenges/new"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-cafe-honey px-3 py-1.5 text-xs font-medium text-cafe-bg shadow hover:bg-cafe-honey-light transition-colors"
            >
              <PlusCircle className="size-3.5" />
              <span>Create Challenge</span>
            </Link>

            <Link
              href={`/challenge/${SEED_CHALLENGE_ID}`}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-cafe-border bg-cafe-card px-3 py-1.5 text-xs font-medium text-cafe-oatmeal hover:text-cafe-parchment hover:bg-cafe-elevated transition-colors"
            >
              <span>Scoreboard</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-cafe-border bg-cafe-wood px-3 py-1.5 text-xs font-medium text-cafe-oatmeal hover:bg-cafe-card hover:text-cafe-linen transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Cockpit</span>
            </Link>
          </nav>

          <UserNav user={session.user} loginCallbackUrl="/admin" />
        </div>
      </header>

      <main className="pb-16">{children}</main>
    </div>
  );
}

