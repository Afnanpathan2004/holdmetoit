import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import HomePage from "./page";
import * as authModule from "@/core/auth";
import { prisma } from "@/core/db";
import { SEED_CHALLENGE_ID } from "@/core/constants/seed";

vi.mock("@/core/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/core/db", () => ({
  prisma: {
    challenge: {
      findUnique: vi.fn(),
    },
  },
}));

describe("HomePage (Landing Page & Development Hub)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders HoldMeToIt branding and product headline", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);

    const jsx = await HomePage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain("HoldMeToIt");
    expect(html).toContain("Study Café &amp; Accountability");
    expect(html).toContain("The Spreadsheet Exorcism");
    expect(html).toContain("Quiet hours study battles &amp; gentle accountability");
  });

  it("renders top navigation with links to Home, Cockpit, Scoreboard, and Host Console", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);

    const jsx = await HomePage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain('href="/"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain(`href="/challenge/${SEED_CHALLENGE_ID}"`);
    expect(html).toContain('href="/admin"');
  });

  it("renders all implemented major surface cards with correct routes", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);

    const jsx = await HomePage();
    const html = renderToStaticMarkup(jsx);

    // Public Scoreboard
    expect(html).toContain("Live Scoreboard &amp; Standings");
    expect(html).toContain(`href="/challenge/${SEED_CHALLENGE_ID}"`);

    // Participant Cockpit
    expect(html).toContain("Participant Cockpit &amp; Desk");
    expect(html).toContain('href="/dashboard"');

    // Host Management Console
    expect(html).toContain("Host Management Console");
    expect(html).toContain('href="/admin"');

    // Challenge Creator Wizard
    expect(html).toContain("Challenge Creator Wizard");
    expect(html).toContain('href="/admin/challenges/new"');

    // Challenge Operations Hub
    expect(html).toContain("Challenge Operations Hub");
    expect(html).toContain(`href="/admin/challenges/${SEED_CHALLENGE_ID}"`);

    // Admin Roster & Hours Overrides
    expect(html).toContain("Admin Roster &amp; Hours Overrides");
    expect(html).toContain(`href="/admin/challenges/${SEED_CHALLENGE_ID}/roster"`);
  });

  it("distinguishes access tiers clearly (Public, Authenticated, Host & Admin)", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);

    const jsx = await HomePage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain("Tier 1 • Public");
    expect(html).toContain("Tier 2 • Authenticated");
    expect(html).toContain("Tier 3 • Host Operations");
    expect(html).toContain("Available Now");
    expect(html).toContain("Requires Discord OAuth");
    expect(html).toContain("Requires Admin Role");
  });

  it("renders Discord Login button when unauthenticated", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);

    const jsx = await HomePage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain("Login with Discord");
    expect(html).toContain('href="/api/auth/signin?callbackUrl=/"');
  });

  it("renders user information and role when authenticated", async () => {
    vi.mocked(authModule.auth).mockResolvedValue({
      user: {
        id: "user-host-1",
        name: "Afnan Pathan",
        username: "afnan",
        role: "ADMIN",
      },
      expires: "2099-01-01",
    } as never);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);

    const jsx = await HomePage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain("Afnan Pathan");
    expect(html).toContain("ADMIN");
  });

  it("renders seeded challenge guide without inventing fake IDs", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);

    const jsx = await HomePage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain(SEED_CHALLENGE_ID);
    expect(html).toContain("Midterm Reading Week Sprint");
    expect(html).toContain("npm run db:seed");
    expect(html).not.toContain("fake-challenge");
    expect(html).not.toContain("12345678");
  });

  it("displays local database detection status when seeded challenge exists", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
      id: SEED_CHALLENGE_ID,
      title: "Midterm Reading Week Sprint",
      status: "UPCOMING",
    } as never);

    const jsx = await HomePage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain("Found in local database (UPCOMING)");
  });

  it("displays implementation status panel with all Slices 0 through 7", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);

    const jsx = await HomePage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain("HoldMeToIt MVP Implementation Status");
    expect(html).toContain("Slice 0: Foundation");
    expect(html).toContain("Slice 1: Domain Engine");
    expect(html).toContain("Slice 2: Persistence &amp; Auth");
    expect(html).toContain("Slice 3: Participant Cockpit");
    expect(html).toContain("Slice 4: Match Scoreboard");
    expect(html).toContain("Slice 5: Host Operations");
    expect(html).toContain("Slice 6: E2E Release Gate");
    expect(html).toContain("Slice 7: Deployment Ready");
    expect(html).toContain("260+ Tests Passing");
  });
});

