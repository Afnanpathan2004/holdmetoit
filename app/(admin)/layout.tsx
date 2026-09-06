import Link from "next/link";
import { Shield, Coffee, PlusCircle, ArrowLeft } from "lucide-react";

import { auth } from "@/core/auth";
import { EmptyState } from "@/components/state/empty-state";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          title="Sign in required"
          description="You must be signed in with Discord to access the community host and administration console."
          action={
            <Button asChild className="min-h-[44px]">
              <Link href="/api/auth/signin?callbackUrl=/admin">
                Login with Discord
              </Link>
            </Button>
          }
        />
      </div>
    );
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

          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Admin Navigation">
            <Link
              href="/admin"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-cafe-border bg-cafe-card px-3.5 py-1.5 text-xs font-medium text-cafe-parchment hover:bg-cafe-elevated transition-colors"
            >
              <span>Challenges</span>
            </Link>

            <Link
              href="/admin/challenges/new"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-cafe-honey px-3.5 py-1.5 text-xs font-medium text-cafe-bg shadow hover:bg-cafe-honey-light transition-colors"
            >
              <PlusCircle className="size-3.5" />
              <span>Create Challenge</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-cafe-border bg-cafe-wood px-3 py-1.5 text-xs font-medium text-cafe-oatmeal hover:bg-cafe-card hover:text-cafe-linen transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Cockpit</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="pb-16">{children}</main>
    </div>
  );
}

