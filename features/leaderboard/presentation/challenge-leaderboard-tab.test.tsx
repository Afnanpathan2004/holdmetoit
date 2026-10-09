import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChallengeLeaderboardTab } from "./challenge-leaderboard-tab";
import type { ChallengeScoreboardViewModel } from "../data/leaderboard-data";

vi.mock("next/navigation", () => ({
   useRouter: () => ({
      push: vi.fn(),
      refresh: vi.fn(),
   }),
}));

describe("ChallengeLeaderboardTab", () => {
   const mockChallenge: ChallengeScoreboardViewModel = {
      id: "test-challenge-1",
      title: "Midterm Reading Week Sprint",
      heroImageUrl: null,
      eventBannerUrl: null,
      punishmentPfpUrl: null,
      format: "TEAM_VS_TEAM",
      status: "ACTIVE",
      startAt: "2026-10-01T00:00:00.000Z",
      endAt: "2026-10-08T00:00:00.000Z",
      daysRemaining: 4,
      totalDays: 7,
      currentDayNumber: 3,
      timeRemainingHuman: "4d 00h 00m",
      teams: [
         {
            id: "team-serpents",
            name: "Serpents",
            color: "#22c55e",
            iconEmoji: "🐍",
            mascotUrl: null,
            sortOrder: 0,
            companionCount: 1,
            totalLoggedSeconds: 25_200, // 7h
            totalLoggedClock: "07:00:00",
            targetSeconds: 126_000, // 35h
            targetClock: "35:00:00",
            targetHours: 35,
            completionPercentage: 20,
            isLeader: true,
         },
         {
            id: "team-raven",
            name: "Raven",
            color: "#3b82f6",
            iconEmoji: "🦅",
            mascotUrl: null,
            sortOrder: 1,
            companionCount: 0,
            totalLoggedSeconds: 0,
            totalLoggedClock: "00:00:00",
            targetSeconds: 0,
            targetClock: "00:00:00",
            targetHours: 0,
            completionPercentage: 0,
            isLeader: false,
         },
      ],
      matchHeader: {
         hasMatchup: true,
         teamA: {
            id: "team-serpents",
            name: "Serpents",
            color: "#22c55e",
            iconEmoji: "🐍",
            mascotUrl: null,
            sortOrder: 0,
            companionCount: 1,
            totalLoggedSeconds: 25_200,
            totalLoggedClock: "07:00:00",
            targetSeconds: 126_000,
            targetClock: "35:00:00",
            targetHours: 35,
            completionPercentage: 20,
            isLeader: true,
         },
         teamB: {
            id: "team-raven",
            name: "Raven",
            color: "#3b82f6",
            iconEmoji: "🦅",
            mascotUrl: null,
            sortOrder: 1,
            companionCount: 0,
            totalLoggedSeconds: 0,
            totalLoggedClock: "00:00:00",
            targetSeconds: 0,
            targetClock: "00:00:00",
            targetHours: 0,
            completionPercentage: 0,
            isLeader: false,
         },
         leadMarginSeconds: 25_200,
         leadMarginClock: "07:00:00",
         leadMarginHuman: "7 hours",
         leaderTeamId: "team-serpents",
         leaderSide: "a",
         ratioPercentageA: 100,
         ratioPercentageB: 0,
      },
      standings: [
         {
            rank: 1,
            participantId: "part-1",
            userId: "user-1",
            displayName: "Afnan",
            username: "afnan",
            image: null,
            teamId: "team-serpents",
            teamName: "Serpents",
            teamColor: "#22c55e",
            teamIcon: "🐍",
            totalLoggedSeconds: 25_200,
            totalLoggedClock: "07:00:00",
            todayLoggedSeconds: 14_400,
            todayLoggedClock: "04:00:00",
            targetSeconds: 126_000,
            targetClock: "35:00:00",
            completionPercentage: 20,
            goalsCompletedCount: 0,
            goalsTotalCount: 0,
            paceStatus: "catch-up",
            paceLabel: "Catch-Up",
            deficitSeconds: 100_800,
         },
      ],
      punishmentWall: {
         punishmentPfpUrl: "/assets/punishment_pfp.jpg",
         flaggedMembers: [],
         isEventCompleted: false,
      },
      currentUser: {
         isLoggedIn: true,
         isEnrolled: true,
         participantId: "part-1",
      },
   };

   it("renders 100% share for Team A and 0% share for Team B (never defaulting 0% to 50%)", () => {
      const html = renderToStaticMarkup(
         createElement(ChallengeLeaderboardTab, {
            challenge: mockChallenge,
         })
      );

      // Tug of war labels
      expect(html).toContain("Share: 100%");
      expect(html).toContain("Share: 0%");
      expect(html).not.toContain("Share: 50%");
   });

   it("renders dynamic weekly targets instead of hardcoded 120h", () => {
      const html = renderToStaticMarkup(
         createElement(ChallengeLeaderboardTab, {
            challenge: mockChallenge,
         })
      );

      expect(html).toContain("Weekly Target: 35h");
      expect(html).toContain("Weekly Target: 0h");
      expect(html).not.toContain("Weekly Target: 120h");
   });

   it("renders team card progress bar with completionPercentage rather than matchup share", () => {
      const html = renderToStaticMarkup(
         createElement(ChallengeLeaderboardTab, {
            challenge: mockChallenge,
         })
      );

      // Team Serpents card has 20% completion (7h/35h), NOT 100% (match share)
      expect(html).toContain("width:20%");
      // Team Raven card has 0% completion, NOT 50%
      expect(html).toContain("width:0%");
   });

   it("renders mobile-first card layout and desktop table with today's hours", () => {
      const html = renderToStaticMarkup(
         createElement(ChallengeLeaderboardTab, {
            challenge: mockChallenge,
         })
      );

      // Mobile header elements
      expect(html).toContain("Rank");
      expect(html).toContain("Participant");
      expect(html).toContain("Total Hours");

      // Mobile card values
      expect(html).toContain("+04:00:00");
      expect(html).toContain("07:00:00");
      expect(html).toContain("/35:00:00");
      expect(html).toContain("Serpents");
      expect(html).toContain("@afnan");
      expect(html).not.toContain("Edit hr");
   });

   it("renders Edit hr buttons for mods and devs when isAdmin is true", () => {
      const html = renderToStaticMarkup(
         createElement(ChallengeLeaderboardTab, {
            challenge: mockChallenge,
            isAdmin: true,
         })
      );

      expect(html).toContain("Edit hr");
   });

   it("renders pagination controls when standings exceed page size", () => {
      const manyStandings = Array.from({ length: 15 }, (_, i) => ({
         ...mockChallenge.standings[0]!,
         participantId: `part-${i + 1}`,
         userId: `user-${i + 1}`,
         displayName: `Scholar ${i + 1}`,
         username: `scholar_${i + 1}`,
         rank: i + 1,
      }));

      const html = renderToStaticMarkup(
         createElement(ChallengeLeaderboardTab, {
            challenge: {
               ...mockChallenge,
               standings: manyStandings,
            },
         })
      );

      expect(html).toContain("Showing");
      expect(html).toContain("1–10");
      expect(html).toContain("15");
      expect(html).toContain("scholars");
      expect(html).toContain("Next");
   });

   it("renders dynamic team colors for head-to-head cards and pill badges", () => {
      const customChallenge: ChallengeScoreboardViewModel = {
         ...mockChallenge,
         teams: [
            {
               ...mockChallenge.teams[0]!,
               name: "Honey Bees",
               color: "#d9822b",
               iconEmoji: "🐝",
            },
            {
               ...mockChallenge.teams[1]!,
               name: "Lavender Butterflies",
               color: "#9986b8",
               iconEmoji: "🦋",
            },
         ],
         matchHeader: {
            ...mockChallenge.matchHeader,
            teamA: {
               ...mockChallenge.matchHeader.teamA!,
               name: "Honey Bees",
               color: "#d9822b",
               iconEmoji: "🐝",
            },
            teamB: {
               ...mockChallenge.matchHeader.teamB!,
               name: "Lavender Butterflies",
               color: "#9986b8",
               iconEmoji: "🦋",
            },
         },
      };

      const html = renderToStaticMarkup(
         createElement(ChallengeLeaderboardTab, {
            challenge: customChallenge,
         })
      );

      // Honey Bees color (rgb 217, 130, 43)
      expect(html).toContain("rgba(217, 130, 43, 0.14)");
      expect(html).toContain("rgba(217, 130, 43, 0.45)");
      expect(html).toContain("background-color:#d9822b");

      // Lavender Butterflies color (rgb 153, 134, 184)
      expect(html).toContain("rgba(153, 134, 184, 0.14)");
      expect(html).toContain("rgba(153, 134, 184, 0.45)");
      expect(html).toContain("background-color:#9986b8");
   });
});
