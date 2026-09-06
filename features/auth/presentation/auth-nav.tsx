import Image from "next/image";
import Link from "next/link";
import { LogOut, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loginWithDiscordAction, logoutAction } from "@/features/auth/api/auth.actions";

export function DiscordIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function SignInWithDiscordButton({
  redirectTo = "/dashboard",
  className,
  size = "default",
  variant = "default",
}: {
  redirectTo?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
}) {
  const handleSignIn = loginWithDiscordAction.bind(null, redirectTo);

  return (
    <form action={handleSignIn} className="inline-block">
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={className}
      >
        <DiscordIcon className="h-4 w-4 mr-2 shrink-0" />
        <span>Sign In with Discord</span>
      </Button>
    </form>
  );
}

export function SignOutButton({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  return (
    <form action={logoutAction} className="inline-block">
      <Button
        type="submit"
        variant="ghost"
        size={size}
        className={className}
      >
        <LogOut className="h-3.5 w-3.5 mr-1.5" />
        <span>Sign Out</span>
      </Button>
    </form>
  );
}

export interface UserNavProps {
  user?: {
    id?: string;
    name?: string | null;
    displayName?: string | null;
    username?: string | null;
    image?: string | null;
    role?: string;
  } | null;
  redirectTo?: string;
}

export function UserNav({ user, redirectTo }: UserNavProps) {
  if (!user) {
    return <SignInWithDiscordButton redirectTo={redirectTo} size="sm" />;
  }

  const displayName = user.displayName || user.name || user.username || "Companion";
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 rounded-full border border-cafe-border bg-cafe-card/80 px-2.5 py-1 text-xs shadow-sm">
        <div className="relative h-6 w-6 overflow-hidden rounded-full border border-cafe-honey/40 bg-cafe-honey/20 shrink-0">
          {user.image ? (
            <Image
              src={user.image}
              alt={displayName}
              fill
              sizes="24px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-serif text-[11px] font-bold text-cafe-honey">
              {initial}
            </span>
          )}
        </div>

        <span className="max-w-[110px] sm:max-w-[140px] truncate font-medium text-cafe-parchment">
          {displayName}
        </span>

        {isAdmin && (
          <span className="inline-flex items-center gap-1 rounded bg-cafe-honey/15 px-1.5 py-0.5 text-[10px] font-semibold text-cafe-honey border border-cafe-honey/30">
            <Shield className="h-2.5 w-2.5" />
            Host
          </span>
        )}
      </div>

      <SignOutButton />
    </div>
  );
}
