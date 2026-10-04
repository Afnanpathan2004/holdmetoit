import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { UserNav } from "./auth-nav";

vi.mock("@/features/auth/api/auth.actions", () => ({
  loginWithDiscordAction: vi.fn(),
  logoutAction: vi.fn(),
}));

describe("UserNav", () => {
  it("renders Discord sign in button when user is null", () => {
    const html = renderToStaticMarkup(createElement(UserNav, { user: null }));
    expect(html).toContain("Sign In with Discord");
    expect(html).not.toContain("Admin Console");
    expect(html).not.toContain("DEV");
  });

  it("renders participant capsule without admin console or dev badge", () => {
    const html = renderToStaticMarkup(
      createElement(UserNav, {
        user: {
          id: "u_1",
          displayName: "AliceStudent",
          role: "PARTICIPANT",
        },
      }),
    );
    expect(html).toContain("AliceStudent");
    expect(html).not.toContain("Admin Console");
    expect(html).not.toContain("dev-role-badge");
  });

  it("renders admin console link for ADMIN role without dev badge", () => {
    const html = renderToStaticMarkup(
      createElement(UserNav, {
        user: {
          id: "u_2",
          displayName: "HostAdmin",
          role: "ADMIN",
        },
      }),
    );
    expect(html).toContain("HostAdmin");
    expect(html).toContain("Admin Console");
    expect(html).toContain("/admin");
    expect(html).not.toContain("dev-role-badge");
  });

  it("renders both admin console link and DEV badge for DEV role", () => {
    const html = renderToStaticMarkup(
      createElement(UserNav, {
        user: {
          id: "u_3",
          displayName: "DevArchitect",
          role: "DEV",
        },
      }),
    );
    expect(html).toContain("DevArchitect");
    expect(html).toContain("Admin Console");
    expect(html).toContain("/admin");
    expect(html).toContain('data-testid="dev-role-badge"');
    expect(html).toContain("DEV");
  });
});
