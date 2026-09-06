import Image from "next/image";
import Link from "next/link";

import { auth } from "@/core/auth";
import { UserNav } from "@/features/auth/presentation/auth-nav";

export default async function ChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-cafe-bg text-cafe-parchment antialiased selection:bg-cafe-honey/20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-cafe-border/80 bg-cafe-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Brand & Stamp */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-xl border border-cafe-border bg-cafe-elevated">
              <Image
                src="/assets/stamp_cafe.jpg"
                alt="HoldMeToIt Stamp"
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-semibold tracking-tight text-cafe-parchment">
                  HoldMeToIt
                </span>
                <span className="rounded-full border border-cafe-honey/30 bg-cafe-elevated px-2 py-0.5 text-[10px] text-cafe-honey-light shadow-sm">
                  Study Café
                </span>
              </div>
            </div>
          </Link>

          {/* Quick Actions */}
          <nav className="flex items-center gap-3 text-xs font-medium">
            <Link
              href="/dashboard"
              className="rounded-lg border border-cafe-border bg-cafe-card px-3 py-1.5 text-cafe-linen transition-colors hover:border-cafe-borderLight hover:text-cafe-parchment"
            >
              My Cockpit
            </Link>

            <UserNav user={session?.user} />
          </nav>
        </div>
      </header>

      {/* Main Page Canvas */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
