import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ChallengeCreatorForm } from "./challenge-creator-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/challenges/api/challenge-admin.actions", () => ({
  createChallengeAction: vi.fn().mockResolvedValue({ ok: true, challengeId: "chal-1" }),
}));

describe("ChallengeCreatorForm Component", () => {
  it("renders format selectors for Team vs Team, Duos, and Solos", () => {
    const html = renderToStaticMarkup(<ChallengeCreatorForm />);

    expect(html).toContain("Law L1 Single Entity Unity");
    expect(html).toContain("Team vs Team (Houses)");
    expect(html).toContain("Duos (N=2 Pairs)");
    expect(html).toContain("Solos (Free-For-All)");
  });

  it("renders default challenge title and date inputs", () => {
    const html = renderToStaticMarkup(<ChallengeCreatorForm />);

    expect(html).toContain("Autumn Study Duel");
    expect(html).toContain("Kickoff Date &amp; Time (UTC)");
    expect(html).toContain("Conclusion Date &amp; Time (UTC)");
    expect(html).toContain("Punishment PFP Asset URL (Optional)");
  });

  it("renders initial house teams for TEAM_VS_TEAM format", () => {
    const html = renderToStaticMarkup(<ChallengeCreatorForm />);

    expect(html).toContain("Honey Bees");
    expect(html).toContain("Lavender Butterflies");
    expect(html).toContain("Save &amp; Configure Roster");
  });
});
