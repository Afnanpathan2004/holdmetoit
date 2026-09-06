import Link from "next/link";

import { Button } from "@/components/ui/button";

const SEED_CHALLENGE_ID = "seed-honey-bees-vs-lavender-butterflies";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-4 py-16 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-cafe-oatmeal">
          Study Café
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-cafe-parchment sm:text-4xl">
          HoldMeToIt
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-cafe-linen">
          Quiet hours study lounge and accountability — warm, precise, and
          guilt-free. Head-to-head match scoreboard, unified standings table,
          and forfeit wall are now live.
        </p>
      </header>

      <section
        className="space-y-5 rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-8"
        aria-label="Active Challenge and Cockpit"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
            Live Challenge Lounge
          </h2>
          <span className="rounded-full border border-cafe-honey/30 bg-cafe-elevated px-2.5 py-0.5 text-xs text-cafe-honey">
            Active Sprint
          </span>
        </div>

        <p className="text-sm text-cafe-oatmeal">
          Spectate the head-to-head battle between{" "}
          <strong className="text-cafe-parchment font-serif">Honey Bees</strong> and{" "}
          <strong className="text-cafe-parchment font-serif">Lavender Butterflies</strong>,
          view real-time participant standings, or step into your personal study desk cockpit.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild className="min-h-[44px]">
            <Link href={`/challenge/${SEED_CHALLENGE_ID}`}>
              View Live Scoreboard
            </Link>
          </Button>

          <Button asChild variant="outline" className="min-h-[44px]">
            <Link href="/dashboard">
              Open Participant Cockpit
            </Link>
          </Button>
        </div>

        <div className="pt-2 border-t border-cafe-border/50">
          <p className="font-script text-base text-cafe-linen">
            ~ &ldquo;quiet study, warm tea, serene progress&rdquo; ~
          </p>
        </div>
      </section>

      <footer className="text-xs text-cafe-ash">
        Interactive prototype remains at{" "}
        <code className="font-mono text-cafe-oatmeal">prototype/index.html</code>.
      </footer>
    </main>
  );
}
