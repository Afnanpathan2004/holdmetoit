import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ManualLeaderboardView } from "./manual-leaderboard-view";
import type { ManualLeaderboardViewModel } from "../data/manual-leaderboard.repository";

vi.mock("next/navigation", () => ({
   useRouter: () => ({
      push: vi.fn(),
      refresh: vi.fn(),
   }),
}));

vi.mock("@/features/leaderboard/api/manual-leaderboard.actions", () => ({
   logManualSessionHoursAction: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/core/observability/logrocket", () => ({
   captureLogRocketException: vi.fn(),
   trackLogRocketEvent: vi.fn(),
}));

vi.mock("next/image", () => ({
   default: ({
      src,
      alt,
      className,
   }: {
      src: string;
      alt: string;
      className?: string;
   }) => createElement("img", { src, alt, className }),
}));

describe("ManualLeaderboardView", () => {
   const mockData: ManualLeaderboardViewModel = {
      challenge: {
         id: "test-manual-chal",
         challengeName: "Sprint Battle",
         challengeColor: "#22c55e",
         punishmentPfp: null,
         status: "ACTIVE",
         startAt: "2026-10-01T00:00:00.000Z",
         endAt: "2026-10-07T00:00:00.000Z",
      },
      summary: {
         teams: [
            {
               teamId: "t1",
               teamName: "Team Bees",
               totalHours: 12.5,
               memberCount: 2,
               isLeader: true,
               rank: 1,
            },
            {
               teamId: "t2",
               teamName: "Team Butterflies",
               totalHours: 8.0,
               memberCount: 1,
               isLeader: false,
               rank: 2,
            },
         ],
         standings: [
            {
               userId: "u1",
               discordName: "Afnan",
               discordId: "123456",
               userPfp: "/avatar1.png",
               teamId: "t1",
               teamName: "Team Bees",
               totalHours: 10.5,
               slotHours: { "2026-10-01": 5.0, "2026-10-02": 5.5 },
               rank: 1,
            },
            {
               userId: "u2",
               discordName: "Bobby",
               discordId: "234567",
               userPfp: null,
               teamId: "t2",
               teamName: "Team Butterflies",
               totalHours: 8.0,
               slotHours: { "2026-10-01": 8.0 },
               rank: 2,
            },
         ],
         matchBanner: {
            hasMatchup: true,
            teamA: {
               teamId: "t1",
               teamName: "Team Bees",
               totalHours: 12.5,
               memberCount: 2,
               isLeader: true,
               rank: 1,
            },
            teamB: {
               teamId: "t2",
               teamName: "Team Butterflies",
               totalHours: 8.0,
               memberCount: 1,
               isLeader: false,
               rank: 2,
            },
            leadMarginHours: 4.5,
            leaderTeamId: "t1",
            leaderSide: "a",
            ratioPercentageA: 61,
            ratioPercentageB: 39,
         },
         slotDates: ["2026-10-01", "2026-10-02"],
         totalHoursLogged: 20.5,
      },
   };

   it("renders search input, team filter dropdown, and participant standings", () => {
      const html = renderToStaticMarkup(
         createElement(ManualLeaderboardView, {
            data: mockData,
         })
      );

      // Search bar
      expect(html).toContain("Search scholars by name, ID, team...");
      // Team filter dropdown
      expect(html).toContain("All Teams (2)");
      expect(html).toContain("Team Bees (2)");
      expect(html).toContain("Team Butterflies (1)");
      // Standings entries
      expect(html).toContain("Afnan");
      expect(html).toContain("Bobby");
      expect(html).toContain("10.5h");
      expect(html).toContain("8.0h");
   });

   it("configures session hours input to allow 0 hours", () => {
      const html = renderToStaticMarkup(
         createElement(ManualLeaderboardView, {
            data: mockData,
            currentUserId: "u1",
            initialModalOpen: true,
         })
      );

      // Verifies min="0" on hours input allows clearing / resetting hours to 0
      expect(html).toContain('min="0"');
      expect(html).not.toContain('min="0.1"');
   });
});
