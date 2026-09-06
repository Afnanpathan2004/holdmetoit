"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Coffee,
  AlertCircle,
  Loader2,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DEMO_CREDENTIALS } from "@/core/auth/demo-credentials";

interface LoginFormProps {
  callbackUrl?: string;
  initialError?: string;
  isDevelopment?: boolean;
}

export function LoginForm({
  callbackUrl = "/dashboard",
  initialError,
  isDevelopment = true,
}: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    getInitialErrorMessage(initialError),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<"discord" | "google" | null>(
    null,
  );
  const [copiedDemo, setCopiedDemo] = useState(false);

  function getInitialErrorMessage(err?: string): string | null {
    if (!err) return null;
    switch (err) {
      case "CredentialsSignin":
        return "Invalid email or password. Please verify your credentials.";
      case "OAuthAccountNotLinked":
        return "This email is already associated with another login provider.";
      case "OAuthSignin":
      case "OAuthCallback":
        return "Could not complete sign in with provider. Please try again.";
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in.";
      default:
        return "An authentication error occurred. Please try again.";
    }
  }

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res || res.error) {
        setErrorMessage(
          "Invalid email or password. Please verify your credentials.",
        );
        setIsLoading(false);
        return;
      }

      router.push(res.url ?? callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred during sign in.");
      setIsLoading(false);
    }
  }

  async function handleOAuthSignIn(provider: "discord" | "google") {
    setErrorMessage(null);
    setIsOAuthLoading(provider);

    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setErrorMessage(`Failed to initiate ${provider} sign in.`);
      setIsOAuthLoading(null);
    }
  }

  function handleFillDemoCredentials() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setErrorMessage(null);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-serif text-2xl font-bold tracking-tight text-cafe-parchment hover:text-cafe-honey-light transition-colors"
        >
          <div className="flex size-10 items-center justify-center rounded-xl border border-cafe-honey/40 bg-cafe-card text-cafe-honey shadow-sm">
            <Coffee className="size-5" />
          </div>
          <span>HoldMeToIt</span>
        </Link>
        <h1 className="text-xl font-serif font-bold text-cafe-parchment sm:text-2xl">
          Sign in to continue
        </h1>
        <p className="text-xs text-cafe-oatmeal sm:text-sm">
          Quiet hours study battles & gentle accountability
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-8 space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div
            className="flex items-start gap-3 rounded-2xl border border-cafe-terracotta/40 bg-cafe-terracotta-surface p-3.5 text-xs text-cafe-linen"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0 text-cafe-terracotta mt-0.5" />
            <p className="flex-1 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3">
          {/* Discord Button */}
          <button
            type="button"
            onClick={() => handleOAuthSignIn("discord")}
            disabled={isLoading || isOAuthLoading !== null}
            className="flex w-full min-h-[44px] items-center justify-center gap-2.5 rounded-xl border border-[#5865F2]/40 bg-[#5865F2] px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#4752C4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2] disabled:opacity-50 transition-colors"
          >
            {isOAuthLoading === "discord" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg
                className="size-4 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            )}
            <span>Continue with Discord</span>
          </button>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => handleOAuthSignIn("google")}
            disabled={isLoading || isOAuthLoading !== null}
            className="flex w-full min-h-[44px] items-center justify-center gap-2.5 rounded-xl border border-cafe-border bg-cafe-wood px-4 py-2.5 text-xs font-semibold text-cafe-parchment shadow-sm hover:bg-cafe-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-honey disabled:opacity-50 transition-colors"
          >
            {isOAuthLoading === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26A11.967 11.967 0 0 0 0 12c0 1.92.45 3.74 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-cafe-border" />
          <span className="absolute bg-cafe-card px-3 font-mono text-[11px] uppercase tracking-wider text-cafe-ash">
            or email credentials
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-cafe-parchment"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@holdmetoit.local"
              disabled={isLoading || isOAuthLoading !== null}
              className="w-full rounded-xl border border-cafe-border bg-cafe-wood px-3.5 py-2.5 text-xs text-cafe-parchment placeholder:text-cafe-ash focus:border-cafe-honey focus:outline-none focus:ring-1 focus:ring-cafe-honey disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-cafe-parchment"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isLoading || isOAuthLoading !== null}
              className="w-full rounded-xl border border-cafe-border bg-cafe-wood px-3.5 py-2.5 text-xs text-cafe-parchment placeholder:text-cafe-ash focus:border-cafe-honey focus:outline-none focus:ring-1 focus:ring-cafe-honey disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || isOAuthLoading !== null}
            className="w-full min-h-[44px] gap-2 text-xs font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </form>

        {/* Local Development Demo Account Section */}
        {isDevelopment && (
          <div className="rounded-2xl border border-cafe-honey/30 bg-cafe-wood p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cafe-honey">
                <Sparkles className="size-3.5" />
                <span className="font-mono text-xs font-semibold">
                  Local Demo Account
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-cafe-sage/40 bg-cafe-sage-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-cafe-sage">
                <ShieldCheck className="size-3" />
                <span>ADMIN</span>
              </span>
            </div>

            <p className="text-[11px] text-cafe-oatmeal leading-relaxed">
              Use this pre-configured local development account to immediately test
              the participant cockpit, self-logging, goal checklists, and host operations:
            </p>

            <div className="rounded-xl border border-cafe-border bg-cafe-card p-2.5 font-mono text-[11px] space-y-1 text-cafe-parchment">
              <div className="flex justify-between">
                <span className="text-cafe-ash">Email:</span>
                <span className="text-cafe-honey-light">{DEMO_CREDENTIALS.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cafe-ash">Password:</span>
                <span className="text-cafe-honey-light">{DEMO_CREDENTIALS.password}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillDemoCredentials}
              className="w-full min-h-[38px] text-xs gap-1.5 border-cafe-honey/40 text-cafe-honey-light hover:bg-cafe-card"
            >
              {copiedDemo ? (
                <>
                  <Check className="size-3.5 text-cafe-sage" />
                  <span>Credentials Loaded!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Use Demo Credentials</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Footer Return Link */}
      <div className="text-center text-xs text-cafe-ash">
        <Link
          href="/"
          className="hover:text-cafe-honey-light transition-colors"
        >
          ← Return to HoldMeToIt Home
        </Link>
      </div>
    </div>
  );
}

