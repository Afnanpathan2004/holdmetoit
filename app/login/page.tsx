import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/core/auth";
import { LoginForm } from "@/features/auth/presentation/login-form";

export const metadata: Metadata = {
  title: "Sign in | HoldMeToIt",
  description: "Sign in to HoldMeToIt to access your study cockpit, log hours, and participate in challenges.",
};

interface LoginPageProps {
  searchParams?: {
    callbackUrl?: string;
    error?: string;
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth().catch(() => null);

  // If already authenticated, redirect to requested callback or dashboard
  if (session?.user?.id) {
    redirect(searchParams?.callbackUrl ?? "/dashboard");
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <main className="flex min-h-screen items-center justify-center bg-cafe-bg px-4 py-12 sm:px-6 lg:px-8">
      <LoginForm
        callbackUrl={searchParams?.callbackUrl}
        initialError={searchParams?.error}
        isDevelopment={isDevelopment}
      />
    </main>
  );
}

