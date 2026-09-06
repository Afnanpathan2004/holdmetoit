import Link from "next/link";
import { Shield, Sparkles, Trophy, UserCheck } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cafe-bg text-cafe-parchment font-sans flex flex-col">
      {/* Top Cozy Ambient Glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-64 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(224, 138, 50, 0.12), transparent 75%)",
        }}
      />

      {/* Admin Navigation Bar */}
      <header className="relative z-10 border-b border-cafe-border bg-cafe-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-serif text-lg font-bold text-cafe-parchment hover:text-cafe-honey transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/20 text-cafe-honey">
                <Shield className="h-4 w-4" />
              </span>
              <span>HoldMeToIt</span>
              <span className="rounded-md bg-cafe-elevated px-2 py-0.5 font-sans text-[11px] font-semibold text-cafe-honey border border-cafe-border">
                Host Console
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/admin"
              className="min-h-[44px] inline-flex items-center text-xs font-medium text-cafe-linen hover:text-cafe-honey transition-colors px-2"
            >
              Tournaments
            </Link>
            <Link
              href="/dashboard"
              className="min-h-[44px] inline-flex items-center text-xs font-medium text-cafe-linen hover:text-cafe-honey transition-colors px-2"
            >
              Participant Cockpit
            </Link>
            <Link
              href="/"
              className="min-h-[44px] inline-flex items-center text-xs font-medium text-cafe-oatmeal hover:text-cafe-parchment transition-colors px-2"
            >
              Public Lounge ↗
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cafe-border bg-cafe-wood/50 py-6 text-center text-xs text-cafe-ash">
        <div className="mx-auto max-w-7xl px-4">
          HoldMeToIt Host Console • Eliminate Spreadsheet Burnout & Automate Study Battles
        </div>
      </footer>
    </div>
  );
}
