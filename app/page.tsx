import { Button } from "@/components/ui/button";

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
          guilt-free. Production scaffolding is live; feature slices arrive
          next.
        </p>
      </header>

      <section
        className="space-y-4 rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-8"
        aria-label="Design foundation preview"
      >
        <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
          Cozy design foundation
        </h2>
        <p className="text-sm text-cafe-oatmeal">
          Fraunces headings, DM Sans UI, JetBrains Mono clocks, and Caveat
          marginalia — aligned with{" "}
          <code className="rounded bg-cafe-elevated px-1.5 py-0.5 font-mono text-xs text-cafe-honey-light">
            DESIGN.md
          </code>
          .
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-cafe-honey/40 bg-cafe-elevated px-3 py-1 text-xs text-cafe-honey">
            Honey accent
          </span>
          <span className="rounded-full border border-cafe-sage/40 bg-cafe-sage-surface px-3 py-1 text-xs text-cafe-sage">
            Sage on-track
          </span>
          <span className="rounded-full border border-cafe-terracotta/40 bg-cafe-terracotta-surface px-3 py-1 text-xs text-cafe-terracotta">
            Terracotta catch-up
          </span>
        </div>

        <p className="font-script text-lg text-cafe-linen">
          On serene pace — deficits roll forward gently.
        </p>

        <p className="font-mono-tabular text-sm text-cafe-honey-light">
          04:30:00 logged today
        </p>

        <Button type="button" className="w-fit">
          Scaffolding ready
        </Button>
      </section>

      <footer className="text-xs text-cafe-ash">
        Interactive prototype remains at{" "}
        <code className="font-mono text-cafe-oatmeal">prototype/index.html</code>
        .
      </footer>
    </main>
  );
}
