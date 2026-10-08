import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/core/db";
import {
   assignTeamMember,
   batchUpsertManualLeaderboardEntries,
   getManualLeaderboardData,
   upsertManualLeaderboardEntry,
} from "./manual-leaderboard.repository";

vi.mock("@/core/db", () => ({
   prisma: {
      challenge: {
         findUnique: vi.fn(),
      },
      leaderboardEntry: {
         upsert: vi.fn(),
      },
      teamMember: {
         upsert: vi.fn(),
         delete: vi.fn(),
      },
      $transaction: vi.fn(),
   },
}));

describe("manual-leaderboard repository", () => {
   beforeEach(() => {
      vi.clearAllMocks();
   });

   describe("getManualLeaderboardData", () => {
      it("returns null if challenge not found", async () => {
         vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);

         const result = await getManualLeaderboardData("non-existent");
         expect(result).toBeNull();
         expect(prisma.challenge.findUnique).toHaveBeenCalledWith({
            where: { id: "non-existent" },
            include: expect.any(Object),
         });
      });

      it("aggregates and returns manual leaderboard view model", async () => {
         const mockChallenge = {
            id: "c_1",
            title: "Weekly Honey Sprint",
            challengeColor: "#e08a32",
            punishmentPfpUrl: "/forfeit.png",
            startAt: new Date("2026-09-28T00:00:00.000Z"),
            endAt: new Date("2026-10-04T00:00:00.000Z"),
            status: "ACTIVE",
            teams: [
               {
                  id: "t_1",
                  challengeId: "c_1",
                  name: "Bees",
                  members: [
                     {
                        teamId: "t_1",
                        userId: "u_1",
                        user: {
                           id: "u_1",
                           displayName: "Afnan",
                           username: "afnan_p",
                           name: null,
                           discordId: "111222",
                           image: "/pfp.png",
                        },
                     },
                  ],
               },
            ],
            leaderboardEntries: [
               {
                  id: "e_1",
                  challengeId: "c_1",
                  userId: "u_1",
                  sessionHours: 5.5,
                  slotDate: new Date("2026-09-28T00:00:00.000Z"),
                  user: {
                     id: "u_1",
                     displayName: "Afnan",
                     username: "afnan_p",
                     name: null,
                     discordId: "111222",
                     image: "/pfp.png",
                  },
               },
            ],
         };

         vi.mocked(prisma.challenge.findUnique).mockResolvedValue(
            mockChallenge as never
         );

         const result = await getManualLeaderboardData("c_1");

         expect(result).not.toBeNull();
         expect(result?.challenge.challengeName).toBe("Weekly Honey Sprint");
         expect(result?.challenge.challengeColor).toBe("#e08a32");
         expect(result?.summary.totalHoursLogged).toBe(5.5);
         expect(result?.summary.standings).toHaveLength(1);
         expect(result?.summary.standings[0]?.discordName).toBe("Afnan");
         expect(result?.summary.standings[0]?.discordId).toBe("111222");
         expect(result?.summary.standings[0]?.totalHours).toBe(5.5);
         expect(result?.summary.teams[0]?.teamName).toBe("Bees");
         expect(result?.summary.teams[0]?.totalHours).toBe(5.5);
      });
   });

   describe("upsertManualLeaderboardEntry", () => {
      it("calls prisma.leaderboardEntry.upsert with composite key and data", async () => {
         const mockDate = new Date("2026-09-29T00:00:00.000Z");
         vi.mocked(prisma.leaderboardEntry.upsert).mockResolvedValue({
            id: "entry_1",
         } as never);

         const res = await upsertManualLeaderboardEntry({
            challengeId: "c_1",
            userId: "u_1",
            slotDate: mockDate,
            sessionHours: 4.25,
         });

         expect(res).toEqual({ id: "entry_1" });
         expect(prisma.leaderboardEntry.upsert).toHaveBeenCalledWith({
            where: {
               challengeId_userId_slotDate: {
                  challengeId: "c_1",
                  userId: "u_1",
                  slotDate: mockDate,
               },
            },
            update: {
               sessionHours: 4.25,
            },
            create: {
               challengeId: "c_1",
               userId: "u_1",
               slotDate: mockDate,
               sessionHours: 4.25,
            },
         });
      });
   });

   describe("batchUpsertManualLeaderboardEntries", () => {
      it("delegates to interactive transaction", async () => {
         vi.mocked(prisma.$transaction).mockResolvedValue([
            { id: "e1" },
         ] as never);

         const entries = [
            {
               userId: "u_1",
               slotDate: new Date("2026-09-28T00:00:00.000Z"),
               sessionHours: 3.0,
            },
         ];

         const res = await batchUpsertManualLeaderboardEntries("c_1", entries);
         expect(prisma.$transaction).toHaveBeenCalledTimes(1);
         expect(res).toEqual([{ id: "e1" }]);
      });
   });

   describe("assignTeamMember", () => {
      it("upserts membership row", async () => {
         vi.mocked(prisma.teamMember.upsert).mockResolvedValue({
            teamId: "t_1",
            userId: "u_1",
         } as never);

         const res = await assignTeamMember("t_1", "u_1");
         expect(res).toEqual({ teamId: "t_1", userId: "u_1" });
         expect(prisma.teamMember.upsert).toHaveBeenCalledWith({
            where: {
               teamId_userId: {
                  teamId: "t_1",
                  userId: "u_1",
               },
            },
            update: {},
            create: {
               teamId: "t_1",
               userId: "u_1",
            },
         });
      });
   });
});
