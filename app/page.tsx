import Link from "next/link";
import {
  Coffee,
  Trophy,
  Shield,
  PlusCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  Terminal,
  ArrowRight,
  ExternalLink,
  Users,
  Compass,
  FileCode,
  LogIn,
} from "lucide-react";

import { auth } from "@/core/auth";
import { prisma } from "@/core/db";
import { SEED_CHALLENGE_ID } from "@/core/constants/seed";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [session, seededChallenge] = await Promise.all([
    auth().catch(() => null),
    prisma.challenge
      .findUnique({
        where: { id: SEED_CHALLENGE_ID },
        select: { id: true, title: true, status: true },
      })
      .catch(() => null),
  ]);

  const user = session?.user;

  return (
    <div className="min-h-screen bg-cafe-bg text-cafe-parchment">
      {/* Top Application & Development Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-cafe-border bg-cafe-wood/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 font-serif text-lg font-bold tracking-tight text-cafe-parchment hover:text-cafe-honey-light transition-colors"
          >
            <div className="flex size-9 items-center justify-center rounded-xl border border-cafe-honey/40 bg-cafe-card text-cafe-honey shadow-sm">
              <Coffee className="size-5" />
            </div>
            <div>
              <span className="block leading-tight">HoldMeToIt</span>
              <span className="block font-sans text-[10px] font-normal tracking-normal text-cafe-oatmeal">
                Study Café & Accountability
              </span>
            </div>
          </Link>

          {/* Primary Top Navigation Links */}
          <nav
            className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs"
            aria-label="Main Navigation"
          >
            <Link
              href="/"
              className="inline-flex min-h-[38px] items-center rounded-xl border border-cafe-honey/50 bg-cafe-elevated px-3 py-1.5 font-medium text-cafe-honey-light shadow-sm transition-colors"
            >
              Home
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex min-h-[38px] items-center rounded-xl border border-cafe-border bg-cafe-card px-3 py-1.5 font-medium text-cafe-parchment hover:bg-cafe-elevated transition-colors"
            >
              Cockpit
            </Link>

            <Link
              href={`/challenge/${SEED_CHALLENGE_ID}`}
              className="inline-flex min-h-[38px] items-center rounded-xl border border-cafe-border bg-cafe-card px-3 py-1.5 font-medium text-cafe-parchment hover:bg-cafe-elevated transition-colors"
            >
              Scoreboard
            </Link>

            <Link
              href="/admin"
              className="inline-flex min-h-[38px] items-center rounded-xl border border-cafe-border bg-cafe-card px-3 py-1.5 font-medium text-cafe-oatmeal hover:text-cafe-parchment hover:bg-cafe-elevated transition-colors"
            >
              Host Console
            </Link>
          </nav>

          {/* Auth Status & Discord Action */}
          <div className="flex items-center gap-2">
            {user?.id ? (
              <div className="flex items-center gap-2 rounded-xl border border-cafe-border bg-cafe-card px-3 py-1.5 text-xs">
                <div className="flex size-6 items-center justify-center rounded-full bg-cafe-elevated text-[11px] font-bold text-cafe-honey">
                  {user.name?.[0] ?? user.username?.[0] ?? "U"}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="font-medium text-cafe-parchment">
                    {user.name ?? user.username ?? "Participant"}
                  </p>
                  <p className="text-[10px] text-cafe-oatmeal uppercase tracking-wider">
                    {user.role ?? "Member"}
                  </p>
                </div>
              </div>
            ) : (
              <Button asChild size="sm" className="min-h-[38px] text-xs">
                <Link href="/api/auth/signin?callbackUrl=/">
                  <LogIn className="size-3.5" />
                  <span>Login with Discord</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-10 lg:p-12">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cafe-honey/30 bg-cafe-elevated px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cafe-honey-light">
              <Sparkles className="size-3.5 text-cafe-honey" />
              <span>Phase 0 MVP • The Spreadsheet Exorcism</span>
            </div>

            <h1 className="font-serif text-3xl font-bold tracking-tight text-cafe-parchment sm:text-4xl lg:text-5xl">
              Quiet hours study battles & gentle accountability.
            </h1>

            <p className="text-sm leading-relaxed text-cafe-linen sm:text-base">
              HoldMeToIt automates Discord study challenges with second-precision
              clock logging (<code className="font-mono text-cafe-honey-light">HH:MM:SS</code>),
              dynamic catch-up deficits (no grace passes), dual-failure accountability (hours + goals),
              and 1-click Discord summary broadcasting. Zero spreadsheets, zero manual arithmetic, and zero moderator burnout.
            </p>

            <p className="font-script text-lg text-cafe-honey-light sm:text-xl">
              &ldquo;Gentle focus, honest hours, and warm tea. Deficits roll forward dynamically without shame.&rdquo;
            </p>

            {/* Quick Primary Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="min-h-[44px]">
                <Link href="/dashboard">
                  <span>Open Participant Cockpit</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <Button asChild variant="secondary" className="min-h-[44px]">
                <Link href={`/challenge/${SEED_CHALLENGE_ID}`}>
                  <Trophy className="size-4 text-cafe-honey" />
                  <span>View Public Scoreboard</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/admin">
                  <Shield className="size-4 text-cafe-oatmeal" />
                  <span>Host Console</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Access Model & Readiness Guide */}
        <section
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          aria-label="Access tier guide"
        >
          <div className="rounded-2xl border border-cafe-sage/30 bg-cafe-sage-surface p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cafe-sage">
                Tier 1 • Public
              </span>
              <span className="rounded-full bg-cafe-sage/20 px-2 py-0.5 text-[10px] font-medium text-cafe-sage">
                Available Now
              </span>
            </div>
            <h3 className="mt-2 font-serif text-base font-semibold text-cafe-parchment">
              Public Spectator Mode
            </h3>
            <p className="mt-1 text-xs text-cafe-oatmeal">
              Zero login required. Anyone with a challenge URL can view live standings, house margin clocks, and the punishment wall.
            </p>
          </div>

          <div className="rounded-2xl border border-cafe-honey/30 bg-cafe-elevated p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cafe-honey">
                Tier 2 • Authenticated
              </span>
              <span className="rounded-full bg-cafe-honey/20 px-2 py-0.5 text-[10px] font-medium text-cafe-honey-light">
                Requires Discord OAuth
              </span>
            </div>
            <h3 className="mt-2 font-serif text-base font-semibold text-cafe-parchment">
              Participant Cockpit
            </h3>
            <p className="mt-1 text-xs text-cafe-oatmeal">
              Requires Discord login and enrollment in a challenge to access daily study logging, intention checklists, and catch-up meters.
            </p>
          </div>

          <div className="rounded-2xl border border-cafe-terracotta/30 bg-cafe-terracotta-surface p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cafe-terracotta">
                Tier 3 • Host Operations
              </span>
              <span className="rounded-full bg-cafe-terracotta/20 px-2 py-0.5 text-[10px] font-medium text-cafe-terracotta">
                Requires Admin Role
              </span>
            </div>
            <h3 className="mt-2 font-serif text-base font-semibold text-cafe-parchment">
              Host Management Hub
            </h3>
            <p className="mt-1 text-xs text-cafe-oatmeal">
              Requires an account with <code className="font-mono text-[10px]">ADMIN</code> role or challenge ownership to create events and edit hours.
            </p>
          </div>
        </section>

        {/* Explore Implemented Surfaces Section */}
        <section className="space-y-6" aria-labelledby="explore-heading">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-cafe-honey">
              <Compass className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cafe-honey-light">
                Application Directory
              </span>
            </div>
            <h2
              id="explore-heading"
              className="font-serif text-2xl font-bold tracking-tight text-cafe-parchment sm:text-3xl"
            >
              Explore Implemented Surfaces
            </h2>
            <p className="text-xs text-cafe-oatmeal sm:text-sm">
              Discover and test every completed screen and workflow implemented across Slices 0 through 7.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Public Spectator Scoreboard */}
            <div className="flex flex-col justify-between rounded-2xl border border-cafe-border bg-cafe-card p-6 shadow-cafe transition-all hover:border-cafe-borderLight">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-cafe-sage/30 bg-cafe-sage-surface text-cafe-sage">
                    <Trophy className="size-4" />
                  </div>
                  <span className="rounded-full border border-cafe-sage/30 bg-cafe-sage-surface px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cafe-sage">
                    Public Spectator
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
                    Live Scoreboard & Standings
                  </h3>
                  <p className="mt-1 font-mono text-xs text-cafe-honey-light">
                    /challenge/[id]
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-cafe-linen">
                  Public spectator screen with head-to-head match banner, leader crown, house margin clock, unified team standings, and the Punishment Nook.
                </p>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t border-cafe-border">
                <Button asChild variant="secondary" className="w-full min-h-[44px]">
                  <Link href={`/challenge/${SEED_CHALLENGE_ID}`}>
                    <span>Open Seeded Demo Scoreboard</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <p className="text-[11px] text-cafe-ash">
                  Demo target: <code className="font-mono text-cafe-oatmeal">{SEED_CHALLENGE_ID}</code>
                </p>
              </div>
            </div>

            {/* Card 2: Participant Cockpit */}
            <div className="flex flex-col justify-between rounded-2xl border border-cafe-border bg-cafe-card p-6 shadow-cafe transition-all hover:border-cafe-borderLight">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-cafe-honey/30 bg-cafe-elevated text-cafe-honey">
                    <Coffee className="size-4" />
                  </div>
                  <span className="rounded-full border border-cafe-honey/30 bg-cafe-elevated px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cafe-honey-light">
                    Authenticated
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
                    Participant Cockpit & Desk
                  </h3>
                  <p className="mt-1 font-mono text-xs text-cafe-honey-light">
                    /dashboard
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-cafe-linen">
                  Student study desk with <code className="font-mono text-[11px]">HH:MM:SS</code> duration logging, catch-up deficit pace meter, and interactive weekly goal checklist.
                </p>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t border-cafe-border">
                <Button asChild className="w-full min-h-[44px]">
                  <Link href="/dashboard">
                    <span>Enter Cockpit</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <p className="text-[11px] text-cafe-ash">
                  Requires Discord OAuth login and challenge enrollment.
                </p>
              </div>
            </div>

            {/* Card 3: Host Dashboard */}
            <div className="flex flex-col justify-between rounded-2xl border border-cafe-border bg-cafe-card p-6 shadow-cafe transition-all hover:border-cafe-borderLight">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-cafe-terracotta/30 bg-cafe-terracotta-surface text-cafe-terracotta">
                    <Shield className="size-4" />
                  </div>
                  <span className="rounded-full border border-cafe-terracotta/30 bg-cafe-terracotta-surface px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cafe-terracotta">
                    Host & Admin
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
                    Host Management Console
                  </h3>
                  <p className="mt-1 font-mono text-xs text-cafe-honey-light">
                    /admin
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-cafe-linen">
                  Host control center with active/upcoming challenge cards, quick operations, and an append-only audit trail feed (<code className="font-mono text-[11px]">AuditLog</code>).
                </p>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t border-cafe-border">
                <Button asChild variant="outline" className="w-full min-h-[44px]">
                  <Link href="/admin">
                    <span>Open Host Dashboard</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <p className="text-[11px] text-cafe-ash">
                  Requires sign-in with <code className="font-mono text-cafe-oatmeal">ADMIN</code> role.
                </p>
              </div>
            </div>

            {/* Card 4: Challenge Creator Wizard */}
            <div className="flex flex-col justify-between rounded-2xl border border-cafe-border bg-cafe-card p-6 shadow-cafe transition-all hover:border-cafe-borderLight">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-cafe-terracotta/30 bg-cafe-terracotta-surface text-cafe-terracotta">
                    <PlusCircle className="size-4" />
                  </div>
                  <span className="rounded-full border border-cafe-terracotta/30 bg-cafe-terracotta-surface px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cafe-terracotta">
                    Host & Admin
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
                    Challenge Creator Wizard
                  </h3>
                  <p className="mt-1 font-mono text-xs text-cafe-honey-light">
                    /admin/challenges/new
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-cafe-linen">
                  Form wizard configuring title, date windows, battle formats (Team vs Team, Duos, Solos with Law L1 parity), custom forfeit avatar, and house teams.
                </p>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t border-cafe-border">
                <Button asChild variant="outline" className="w-full min-h-[44px]">
                  <Link href="/admin/challenges/new">
                    <span>Create New Challenge</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <p className="text-[11px] text-cafe-ash">
                  Creates challenges in <code className="font-mono text-cafe-oatmeal">UPCOMING</code> state.
                </p>
              </div>
            </div>

            {/* Card 5: Challenge Operations Hub */}
            <div className="flex flex-col justify-between rounded-2xl border border-cafe-border bg-cafe-card p-6 shadow-cafe transition-all hover:border-cafe-borderLight">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-cafe-terracotta/30 bg-cafe-terracotta-surface text-cafe-terracotta">
                    <Sparkles className="size-4" />
                  </div>
                  <span className="rounded-full border border-cafe-terracotta/30 bg-cafe-terracotta-surface px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cafe-terracotta">
                    Host & Admin
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
                    Challenge Operations Hub
                  </h3>
                  <p className="mt-1 font-mono text-xs text-cafe-honey-light">
                    /admin/challenges/[id]
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-cafe-linen">
                  Event controls: trigger manual kickoff, lock and freeze final results, manage participants, rename duo teams, and copy 1-click Discord summaries.
                </p>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t border-cafe-border">
                <Button asChild variant="outline" className="w-full min-h-[44px]">
                  <Link href={`/admin/challenges/${SEED_CHALLENGE_ID}`}>
                    <span>Manage Seeded Challenge</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <p className="text-[11px] text-cafe-ash">
                  Target: <code className="font-mono text-cafe-oatmeal">{SEED_CHALLENGE_ID}</code>
                </p>
              </div>
            </div>

            {/* Card 6: Admin Roster & Overrides */}
            <div className="flex flex-col justify-between rounded-2xl border border-cafe-border bg-cafe-card p-6 shadow-cafe transition-all hover:border-cafe-borderLight">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-cafe-terracotta/30 bg-cafe-terracotta-surface text-cafe-terracotta">
                    <Clock className="size-4" />
                  </div>
                  <span className="rounded-full border border-cafe-terracotta/30 bg-cafe-terracotta-surface px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cafe-terracotta">
                    Host & Admin
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
                    Admin Roster & Hours Overrides
                  </h3>
                  <p className="mt-1 font-mono text-xs text-cafe-honey-light">
                    /admin/challenges/[id]/roster
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-cafe-linen">
                  Tabular member roster with inline cell click to correct daily study hours (Law L5), audit log justification modal, and host pardon/excuse workflow.
                </p>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t border-cafe-border">
                <Button asChild variant="outline" className="w-full min-h-[44px]">
                  <Link href={`/admin/challenges/${SEED_CHALLENGE_ID}/roster`}>
                    <span>Open Seeded Roster Grid</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <p className="text-[11px] text-cafe-ash">
                  Target: <code className="font-mono text-cafe-oatmeal">{SEED_CHALLENGE_ID}</code>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seeded Challenge & Discovery Section */}
        <section
          className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-8"
          aria-labelledby="seed-heading"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2 text-cafe-honey">
                <Terminal className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-wider text-cafe-honey-light">
                  Local Development & Sample Data
                </span>
              </div>

              <h2
                id="seed-heading"
                className="font-serif text-xl font-bold text-cafe-parchment sm:text-2xl"
              >
                Seeded Sample Challenge: &ldquo;Midterm Reading Week Sprint&rdquo;
              </h2>

              <p className="text-xs leading-relaxed text-cafe-linen sm:text-sm">
                The repository includes a deterministic, idempotent database seed script (
                <code className="font-mono text-cafe-honey-light">prisma/seed.ts</code>
                ) that creates a sample Team vs Team battle between the <strong>Honey Bees (🐝)</strong> and <strong>Lavender Butterflies (🦋)</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="rounded-lg border border-cafe-border bg-cafe-elevated px-2.5 py-1 font-mono text-xs text-cafe-parchment">
                  ID: {SEED_CHALLENGE_ID}
                </span>

                {seededChallenge ? (
                  <span className="rounded-lg border border-cafe-sage/40 bg-cafe-sage-surface px-2.5 py-1 text-xs text-cafe-sage">
                    ✓ Found in local database ({seededChallenge.status})
                  </span>
                ) : (
                  <span className="rounded-lg border border-cafe-honey/40 bg-cafe-elevated px-2.5 py-1 text-xs text-cafe-honey-light">
                    ⓘ Run <code className="font-mono">npm run db:seed</code> to populate
                  </span>
                )}
              </div>

              <p className="text-xs text-cafe-oatmeal">
                <strong>How to obtain custom challenge IDs:</strong> When creating challenges at{" "}
                <code className="font-mono text-cafe-linen">/admin/challenges/new</code>, their generated IDs appear in the URL and are listed on the Host Dashboard (
                <code className="font-mono text-cafe-linen">/admin</code>). You can also inspect all IDs directly using Prisma Studio (<code className="font-mono text-cafe-linen">npm run db:studio</code>).
              </p>
            </div>

            {/* Quick Link Buttons for the Seeded Challenge */}
            <div className="flex flex-col gap-2.5 sm:min-w-[240px]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cafe-oatmeal">
                Direct Sample Links
              </span>

              <Button asChild variant="secondary" size="sm" className="justify-start min-h-[40px]">
                <Link href={`/challenge/${SEED_CHALLENGE_ID}`}>
                  <Trophy className="size-3.5 text-cafe-honey" />
                  <span>Public Scoreboard</span>
                </Link>
              </Button>

              <Button asChild variant="outline" size="sm" className="justify-start min-h-[40px]">
                <Link href={`/admin/challenges/${SEED_CHALLENGE_ID}`}>
                  <Sparkles className="size-3.5 text-cafe-oatmeal" />
                  <span>Admin Operations</span>
                </Link>
              </Button>

              <Button asChild variant="outline" size="sm" className="justify-start min-h-[40px]">
                <Link href={`/admin/challenges/${SEED_CHALLENGE_ID}/roster`}>
                  <Clock className="size-3.5 text-cafe-oatmeal" />
                  <span>Roster & Overrides</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Implementation Status Panel (Informational Only) */}
        <section
          className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-8"
          aria-labelledby="status-heading"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cafe-sage">
                  Quality Matrix & Milestones
                </span>
                <h2
                  id="status-heading"
                  className="mt-1 font-serif text-xl font-bold text-cafe-parchment sm:text-2xl"
                >
                  HoldMeToIt MVP Implementation Status
                </h2>
              </div>
              <span className="rounded-full border border-cafe-sage/40 bg-cafe-sage-surface px-3 py-1 font-mono text-xs font-semibold text-cafe-sage">
                260+ Tests Passing (100% Green)
              </span>
            </div>

            <p className="text-xs text-cafe-oatmeal sm:text-sm">
              All vertical slices and E2E journeys (J1–J6) are implemented and validated against the 9 Foundational Product & Stack Laws.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <div className="flex items-start gap-2.5 rounded-xl border border-cafe-border bg-cafe-wood p-3">
                <CheckCircle2 className="size-4 shrink-0 text-cafe-sage mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cafe-parchment">Slice 0: Foundation</p>
                  <p className="text-[11px] text-cafe-oatmeal">App Router, tokens & typography</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-cafe-border bg-cafe-wood p-3">
                <CheckCircle2 className="size-4 shrink-0 text-cafe-sage mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cafe-parchment">Slice 1: Domain Engine</p>
                  <p className="text-[11px] text-cafe-oatmeal">Pure math & deficit formulas (Vitest)</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-cafe-border bg-cafe-wood p-3">
                <CheckCircle2 className="size-4 shrink-0 text-cafe-sage mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cafe-parchment">Slice 2: Persistence & Auth</p>
                  <p className="text-[11px] text-cafe-oatmeal">Prisma ORM & Discord OAuth 2.0</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-cafe-border bg-cafe-wood p-3">
                <CheckCircle2 className="size-4 shrink-0 text-cafe-sage mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cafe-parchment">Slice 3: Participant Cockpit</p>
                  <p className="text-[11px] text-cafe-oatmeal">HH:MM:SS logging & goals checklist</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-cafe-border bg-cafe-wood p-3">
                <CheckCircle2 className="size-4 shrink-0 text-cafe-sage mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cafe-parchment">Slice 4: Match Scoreboard</p>
                  <p className="text-[11px] text-cafe-oatmeal">Margin delta & punishment wall</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-cafe-border bg-cafe-wood p-3">
                <CheckCircle2 className="size-4 shrink-0 text-cafe-sage mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cafe-parchment">Slice 5: Host Operations</p>
                  <p className="text-[11px] text-cafe-oatmeal">Inline overrides & Discord summaries</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-cafe-border bg-cafe-wood p-3">
                <CheckCircle2 className="size-4 shrink-0 text-cafe-sage mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cafe-parchment">Slice 6: E2E Release Gate</p>
                  <p className="text-[11px] text-cafe-oatmeal">Journeys J1–J6 verified 100% green</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-cafe-border bg-cafe-wood p-3">
                <CheckCircle2 className="size-4 shrink-0 text-cafe-sage mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cafe-parchment">Slice 7: Deployment Ready</p>
                  <p className="text-[11px] text-cafe-oatmeal">Postgres migration & Vercel target</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local Developer Quickstart Box */}
        <section className="rounded-2xl border border-cafe-border bg-cafe-wood p-5 text-xs text-cafe-oatmeal">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cafe-border pb-3">
            <span className="font-mono text-cafe-honey-light font-medium">
              Local Development CLI Reference
            </span>
            <span className="font-mono text-[10px] text-cafe-ash">Node.js • Next.js 14 • Prisma</span>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-2 lg:grid-cols-3 font-mono text-[11px]">
            <div>
              <span className="text-cafe-parchment">npm run dev</span> — Start Next.js dev server
            </div>
            <div>
              <span className="text-cafe-parchment">npm run db:seed</span> — Populate sample challenge
            </div>
            <div>
              <span className="text-cafe-parchment">npm run db:studio</span> — Open database GUI
            </div>
            <div>
              <span className="text-cafe-parchment">npm run test</span> — Run 254-test Vitest suite
            </div>
            <div>
              <span className="text-cafe-parchment">npm run typecheck</span> — Strict TypeScript check
            </div>
            <div>
              <span className="text-cafe-parchment">npm run build</span> — Production build test
            </div>
          </div>
        </section>
      </main>

      {/* Cozy Footer */}
      <footer className="border-t border-cafe-border bg-cafe-wood/50 py-8 text-center text-xs text-cafe-ash">
        <div className="mx-auto max-w-7xl px-4 space-y-2">
          <p className="font-serif text-sm font-medium text-cafe-parchment">
            HoldMeToIt • Cozy Study Accountability & Challenge Management
          </p>
          <p>
            Built with Next.js 14, TypeScript, Tailwind CSS, Prisma ORM & Auth.js.
          </p>
          <p className="font-mono text-[10px] text-cafe-oatmeal pt-1">
            Standings & calculations governed by Foundational Laws L1–L9.
          </p>
        </div>
      </footer>
    </div>
  );
}
