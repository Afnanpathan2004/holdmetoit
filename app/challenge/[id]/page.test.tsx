import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import ChallengePage, { generateMetadata } from "./page";
import * as scoreboardRepo from "@/features/leaderboard/data/scoreboard.repository";
import * as authModule from "@/core/auth";
import * as nextNavigation from "next/navigation";

vi.mock("@/features/leaderboard/data/scoreboard.repository", () => ({
  getScoreboardData: vi.fn(),
}));

vi.mock("@/core/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("ChallengePage (Public Spectator Route)", () => {
  const mockScoreboardData: scoreboardRepo.ScoreboardViewModel = {
    challenge: {
      id: "chal-1",
      title: "Autumn Study Clash",
      format: "TEAM_VS_TEAM",
      status: "ACTIVE",
      startAt: new Date("2026-09-01"),
      endAt: new Date("2026-09-08"),
      punishmentPfpUrl: null,
    },
    teams: [
      {
        id: "t1",
        name: "Team Sol",
        color: "#ebb06e",
        iconEmoji: "☀️",
        mascotUrl: null,
        sortOrder: 0,
        totalSeconds: 36000,
        memberCount: 1,
      },
      {
        id: "t2",
        name: "Team Luna",
        color: "#9986b8",
        iconEmoji: "🌙",
        mascotUrl: null,
        sortOrder: 1,
        totalSeconds: 18000,
        memberCount: 1,
      },
    ],
    leadMargin: {
      marginSeconds: 18000,
      leader: "a",
      signedMarginSeconds: 18000,
      leadingTeam: null,
      trailingTeam: null,
      isTie: false,
    },
    participants: [],
    punishedParticipants: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateMetadata", () => {
    it("returns not found title when challenge is missing", async () => {
      vi.mocked(scoreboardRepo.getScoreboardData).mockResolvedValueOnce(null);

      const meta = await generateMetadata({ params: { id: "missing" } });
      expect(meta.title).toBe("Challenge Not Found | HoldMeToIt");
    });

    it("returns formatted challenge title when challenge exists", async () => {
      vi.mocked(scoreboardRepo.getScoreboardData).mockResolvedValueOnce(mockScoreboardData);

      const meta = await generateMetadata({ params: { id: "chal-1" } });
      expect(meta.title).toBe("Autumn Study Clash | Live Scoreboard & Standings");
    });
  });

  describe("ChallengePage rendering", () => {
    it("calls notFound() if challenge data is null", async () => {
      vi.mocked(scoreboardRepo.getScoreboardData).mockResolvedValueOnce(null);
      vi.mocked(authModule.auth).mockResolvedValueOnce(null as never);

      await expect(ChallengePage({ params: { id: "chal-missing" } })).rejects.toThrow(
        "NEXT_NOT_FOUND",
      );
      expect(nextNavigation.notFound).toHaveBeenCalled();
    });

    it("renders spectator view for unauthenticated visitors (Law L4: Spectator Access)", async () => {
      vi.mocked(scoreboardRepo.getScoreboardData).mockResolvedValueOnce(mockScoreboardData);
      vi.mocked(authModule.auth).mockResolvedValueOnce(null as never);

      const element = await ChallengePage({ params: { id: "chal-1" } });
      const html = renderToStaticMarkup(element);

      expect(html).toContain("Autumn Study Clash");
      expect(html).toContain("Public Spectator Mode");
      expect(html).toContain("Login with Discord");
    });

    it("renders link back to cockpit when visitor is logged in", async () => {
      vi.mocked(scoreboardRepo.getScoreboardData).mockResolvedValueOnce(mockScoreboardData);
      vi.mocked(authModule.auth).mockResolvedValueOnce({
        user: { id: "u-123" },
      } as never);

      const element = await ChallengePage({ params: { id: "chal-1" } });
      const html = renderToStaticMarkup(element);

      expect(html).toContain("Autumn Study Clash");
      expect(html).toContain("Back to Cockpit");
      expect(html).not.toContain("Login with Discord");
    });
  });
});

