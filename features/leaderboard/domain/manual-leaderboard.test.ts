import { describe, expect, it } from "vitest";

import {
   aggregateManualLeaderboard,
   computeIndividualStandings,
   computeMatchBanner,
   computeTeamStandings,
   type LeaderboardEntryRef,
   type TeamMemberRef,
   type TeamRef,
   type UserRef,
} from "./manual-leaderboard";

describe("manual-leaderboard domain logic", () => {
   const mockUsers: UserRef[] = [
      {
         id: "u1",
         discordName: "Afnan",
         discordId: "123456",
         userPfp: "/avatar1.png",
      },
      {
         id: "u2",
         discordName: "Bobby",
         discordId: "234567",
         userPfp: "/avatar2.png",
      },
      { id: "u3", discordName: "Charlie", discordId: "345678", userPfp: null },
   ];

   const mockTeams: TeamRef[] = [
      { id: "t1", name: "Team Bees", challengeId: "c1" },
      { id: "t2", name: "Team Butterflies", challengeId: "c1" },
   ];

   const mockTeamMembers: TeamMemberRef[] = [
      { teamId: "t1", userId: "u1" },
      { teamId: "t1", userId: "u2" },
      { teamId: "t2", userId: "u3" },
   ];

   const mockEntries: LeaderboardEntryRef[] = [
      {
         id: "e1",
         challengeId: "c1",
         userId: "u1",
         sessionHours: 4.5,
         slotDate: "2026-09-28",
      },
      {
         id: "e2",
         challengeId: "c1",
         userId: "u1",
         sessionHours: 3.0,
         slotDate: "2026-09-29",
      },
      {
         id: "e3",
         challengeId: "c1",
         userId: "u2",
         sessionHours: 2.0,
         slotDate: "2026-09-28",
      },
      {
         id: "e4",
         challengeId: "c1",
         userId: "u3",
         sessionHours: 8.0,
         slotDate: "2026-09-28",
      },
   ];

   it("computes individual standings ranked descending by total hours", () => {
      const standings = computeIndividualStandings(
         mockUsers,
         mockTeams,
         mockTeamMembers,
         mockEntries
      );

      expect(standings).toHaveLength(3);
      // u3 has 8.0 hrs -> rank 1
      expect(standings[0]?.userId).toBe("u3");
      expect(standings[0]?.totalHours).toBe(8.0);
      expect(standings[0]?.rank).toBe(1);
      expect(standings[0]?.teamName).toBe("Team Butterflies");
      expect(standings[0]?.discordId).toBe("345678");

      // u1 has 4.5 + 3.0 = 7.5 hrs -> rank 2
      expect(standings[1]?.userId).toBe("u1");
      expect(standings[1]?.totalHours).toBe(7.5);
      expect(standings[1]?.rank).toBe(2);
      expect(standings[1]?.slotHours).toEqual({
         "2026-09-28": 4.5,
         "2026-09-29": 3.0,
      });

      // u2 has 2.0 hrs -> rank 3
      expect(standings[2]?.userId).toBe("u2");
      expect(standings[2]?.totalHours).toBe(2.0);
      expect(standings[2]?.rank).toBe(3);
   });

   it("computes team standings correctly summing member hours", () => {
      const teamStandings = computeTeamStandings(
         mockTeams,
         mockTeamMembers,
         mockEntries
      );

      expect(teamStandings).toHaveLength(2);
      // Team Bees (u1 + u2) = 7.5 + 2.0 = 9.5 hrs
      expect(teamStandings[0]?.teamId).toBe("t1");
      expect(teamStandings[0]?.totalHours).toBe(9.5);
      expect(teamStandings[0]?.memberCount).toBe(2);
      expect(teamStandings[0]?.isLeader).toBe(true);
      expect(teamStandings[0]?.rank).toBe(1);

      // Team Butterflies (u3) = 8.0 hrs
      expect(teamStandings[1]?.teamId).toBe("t2");
      expect(teamStandings[1]?.totalHours).toBe(8.0);
      expect(teamStandings[1]?.memberCount).toBe(1);
      expect(teamStandings[1]?.isLeader).toBe(false);
      expect(teamStandings[1]?.rank).toBe(2);
   });

   it("computes head-to-head match banner and delta margin", () => {
      const teamStandings = computeTeamStandings(
         mockTeams,
         mockTeamMembers,
         mockEntries
      );
      const banner = computeMatchBanner(teamStandings);

      expect(banner.hasMatchup).toBe(true);
      expect(banner.teamA?.teamName).toBe("Team Bees");
      expect(banner.teamB?.teamName).toBe("Team Butterflies");
      // 9.5 - 8.0 = 1.5 margin
      expect(banner.leadMarginHours).toBe(1.5);
      expect(banner.leaderTeamId).toBe("t1");
      expect(banner.leaderSide).toBe("a");
      expect(banner.ratioPercentageA).toBeGreaterThan(50);
   });

   it("aggregates whole manual leaderboard summary", () => {
      const summary = aggregateManualLeaderboard(
         mockUsers,
         mockTeams,
         mockTeamMembers,
         mockEntries
      );

      expect(summary.totalHoursLogged).toBe(17.5);
      expect(summary.slotDates).toEqual(["2026-09-28", "2026-09-29"]);
      expect(summary.teams).toHaveLength(2);
      expect(summary.standings).toHaveLength(3);
   });
});
