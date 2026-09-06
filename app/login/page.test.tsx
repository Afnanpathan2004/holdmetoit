import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { LoginForm } from "@/features/auth/presentation/login-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("Login Form Presentation (features/auth/presentation/login-form.tsx)", () => {
  it("renders Discord and Google OAuth options", () => {
    const html = renderToStaticMarkup(<LoginForm isDevelopment={true} />);

    expect(html).toContain("Continue with Discord");
    expect(html).toContain("Continue with Google");
  });

  it("renders email and password inputs with accessible labels and sign in button", () => {
    const html = renderToStaticMarkup(<LoginForm isDevelopment={true} />);

    expect(html).toContain("Email Address");
    expect(html).toContain('id="email"');
    expect(html).toContain('type="email"');
    expect(html).toContain("Password");
    expect(html).toContain('id="password"');
    expect(html).toContain('type="password"');
    expect(html).toContain("Sign in");
  });

  it("renders local demo account card in development mode", () => {
    const html = renderToStaticMarkup(<LoginForm isDevelopment={true} />);

    expect(html).toContain("Local Demo Account");
    expect(html).toContain("demo@holdmetoit.local");
    expect(html).toContain("HoldMeToIt123!");
    expect(html).toContain("ADMIN");
    expect(html).toContain("Use Demo Credentials");
  });

  it("omits local demo account card outside development mode", () => {
    const html = renderToStaticMarkup(<LoginForm isDevelopment={false} />);

    expect(html).not.toContain("Local Demo Account");
    expect(html).not.toContain("demo@holdmetoit.local");
    expect(html).not.toContain("HoldMeToIt123!");
  });

  it("displays credentials error banner when initialError is CredentialsSignin", () => {
    const html = renderToStaticMarkup(
      <LoginForm initialError="CredentialsSignin" isDevelopment={true} />,
    );

    expect(html).toContain("Invalid email or password");
  });

  it("displays OAuth error banner when initialError is OAuthCallback", () => {
    const html = renderToStaticMarkup(
      <LoginForm initialError="OAuthCallback" isDevelopment={true} />,
    );

    expect(html).toContain("Could not complete sign in with provider");
  });
});

