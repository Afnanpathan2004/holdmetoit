import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { UserNav } from "./auth-nav";

vi.mock("@/features/auth/api/auth.actions", () => ({
  loginWithDiscordAction: vi.fn(),
  logoutAction: vi.fn(),
}));

vi.mock("@/features/auth/api/preview-mode.actions", () => ({
  toggleParticipantPreviewAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("UserNav", () => {
  it("renders Discord sign in button when user is null", () => {
    const html = renderToStaticMarkup(createElement(UserNav, { user: null }));
    expect(html).toContain("Sign In with Discord");
    expect(html).not.toContain("Challenges");
    expect(html).not.toContain("DEV");
    expect(html).not.toContain("enter-preview-button");
  });

  it("renders participant capsule without challenges link, preview button, or dev badge", () => {
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
    expect(html).not.toContain("Challenges");
    expect(html).not.toContain("dev-role-badge");
    expect(html).not.toContain("enter-preview-button");
    expect(html).not.toContain("exit-preview-button");
  });

  it("renders challenges link and enter-preview button for ADMIN role without dev badge", () => {
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
    expect(html).toContain("Challenges");
    expect(html).toContain("/admin");
    expect(html).toContain('data-testid="enter-preview-button"');
    expect(html).toContain("Preview as Participant");
    expect(html).not.toContain("dev-role-badge");
  });

  it("renders both challenges link, enter-preview button, and DEV badge for DEV role", () => {
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
    expect(html).toContain("Challenges");
    expect(html).toContain("/admin");
    expect(html).toContain('data-testid="enter-preview-button"');
    expect(html).toContain('data-testid="dev-role-badge"');
    expect(html).toContain("DEV");
  });

  it("hides Challenges link and DEV badge when isPreviewActive is true, and renders Exit Preview button", () => {
    const html = renderToStaticMarkup(
      createElement(UserNav, {
        user: {
          id: "u_3",
          displayName: "DevArchitect",
          role: "DEV",
        },
        isActualAdmin: true,
        isPreviewActive: true,
      }),
    );
    expect(html).toContain("DevArchitect");
    expect(html).not.toContain("Challenges");
    expect(html).not.toContain("/admin");
    expect(html).not.toContain('data-testid="dev-role-badge"');
    expect(html).toContain('data-testid="exit-preview-button"');
    expect(html).toContain("Exit Preview");
  });
});
