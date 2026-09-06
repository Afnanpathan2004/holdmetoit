import Link from "next/link";

import { auth } from "@/core/auth";
import { UserNav } from "@/features/auth/presentation/auth-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-cafe-border bg-cafe-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-lg font-semibold text-cafe-parchment">
              HoldMeToIt
            </Link>
            <span className="text-xs text-cafe-ash border-l border-cafe-border/80 pl-3">Participant Cockpit</span>
          </div>
          <UserNav user={session?.user} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

