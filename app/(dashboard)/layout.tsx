import Link from "next/link";
import { Coffee, ArrowLeft } from "lucide-react";

import { SEED_CHALLENGE_ID } from "@/core/constants/seed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cafe-bg text-cafe-parchment">
      <header className="border-b border-cafe-border bg-cafe-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-serif text-lg font-semibold text-cafe-parchment hover:text-cafe-honey-light transition-colors"
            >
              <div className="flex size-8 items-center justify-center rounded-lg border border-cafe-honey/40 bg-cafe-wood text-cafe-honey">
                <Coffee className="size-4" />
              </div>
              <span>HoldMeToIt</span>
            </Link>
            <span className="hidden sm:inline text-xs text-cafe-ash">|</span>
            <p className="text-xs text-cafe-oatmeal">Participant Cockpit</p>
          </div>

          <nav
            className="flex items-center gap-2 text-xs"
            aria-label="Cockpit Top Navigation"
          >
            <Link
              href="/"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-cafe-border bg-cafe-wood px-3 py-1.5 text-cafe-linen hover:bg-cafe-card hover:text-cafe-parchment transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Home</span>
            </Link>
            <Link
              href={`/challenge/${SEED_CHALLENGE_ID}`}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-cafe-border bg-cafe-wood px-3 py-1.5 text-cafe-linen hover:bg-cafe-card hover:text-cafe-parchment transition-colors"
            >
              <span>Scoreboard</span>
            </Link>
            <Link
              href="/admin"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-cafe-border bg-cafe-wood px-3 py-1.5 text-cafe-oatmeal hover:bg-cafe-card hover:text-cafe-linen transition-colors"
            >
              <span>Host Console</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
