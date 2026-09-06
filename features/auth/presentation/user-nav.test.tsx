import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { UserNav } from "./user-nav";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("UserNav Component (features/auth/presentation/user-nav.tsx)", () => {
  it("renders 'Log in' button when unauthenticated", () => {
    const html = renderToStaticMarkup(<UserNav user={null} />);

    expect(html).toContain("Log in");
    expect(html).toContain('href="/login"');
  });

  it("renders 'Log in' button with callbackUrl when provided", () => {
    const html = renderToStaticMarkup(
      <UserNav user={null} loginCallbackUrl="/admin" />,
    );

    expect(html).toContain("Log in");
    expect(html).toContain('href="/login?callbackUrl=%2Fadmin"');
  });

  it("renders authenticated user identity and 'Log out' button", () => {
    const mockUser = {
      id: "u-123",
      name: "Afnan Pathan",
      displayName: "Afnan",
      role: "ADMIN",
      image: null,
    };

    const html = renderToStaticMarkup(<UserNav user={mockUser} />);

    expect(html).not.toContain("Log in");
    expect(html).toContain("Afnan");
    expect(html).toContain("Admin");
    expect(html).toContain("Log out");
  });

  it("renders user avatar image if provided", () => {
    const mockUser = {
      id: "u-456",
      name: "Demo Admin",
      image: "https://example.com/avatar.png",
      role: "PARTICIPANT",
    };

    const html = renderToStaticMarkup(<UserNav user={mockUser} />);

    expect(html).toContain('src="https://example.com/avatar.png"');
    expect(html).toContain("Demo Admin");
    expect(html).toContain("Member");
  });
});

