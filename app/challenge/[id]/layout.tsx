import Image from "next/image";
import Link from "next/link";

import { auth } from "@/core/auth";

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

            {session?.user ? (
              <div className="flex items-center gap-2 rounded-full border border-cafe-border bg-cafe-card/70 px-2.5 py-1 text-xs">
                <div className="relative h-5 w-5 overflow-hidden rounded-full border border-cafe-honey/40 bg-cafe-honey/20">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      fill
                      sizes="20px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-serif text-[10px] font-bold text-cafe-honey">
                      {(session.user.name ?? "U").slice(0, 1)}
                    </span>
                  )}
                </div>
                <span className="max-w-[120px] truncate text-cafe-parchment">
                  {session.user.name ?? "Companions"}
                </span>
              </div>
            ) : (
              <Link
                href="/api/auth/signin"
                className="rounded-lg bg-cafe-honey px-3 py-1.5 font-semibold text-cafe-bg transition-colors hover:bg-cafe-honey-light"
              >
                Sign In
              </Link>
            )}
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
