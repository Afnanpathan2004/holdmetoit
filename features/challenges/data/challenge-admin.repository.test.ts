import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/core/db";
import {
   adminEnrollParticipant,
   adminUpdateParticipantTarget,
   createAdminChallenge,
   deleteAdminChallenge,
   kickoffChallenge,
   listAllChallengesForAdmin,
   lockChallengeResults,
   reassignParticipantTeam,
   updateAdminChallenge,
} from "./challenge-admin.repository";

vi.mock("@/core/db", () => {
   const mockPrisma = {
      challenge: {
         findMany: vi.fn(),
         findUnique: vi.fn(),
         create: vi.fn(),
         update: vi.fn(),
         delete: vi.fn(),
      },
      team: {
         findUnique: vi.fn(),
         update: vi.fn(),
         create: vi.fn(),
         deleteMany: vi.fn(),
      },
      challengeParticipant: {
         findUnique: vi.fn(),
         create: vi.fn(),
         update: vi.fn(),
         deleteMany: vi.fn(),
      },
      dailyStudyLog: {
         deleteMany: vi.fn(),
      },
      leaderboardEntry: {
         deleteMany: vi.fn(),
      },
      teamMember: {
         deleteMany: vi.fn(),
      },
      punishmentRecord: {
         upsert: vi.fn(),
         deleteMany: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma)),
   };
   return { prisma: mockPrisma };
});

vi.mock("@/features/audit/data/audit-log.repository", () => ({
   recordAuditEvent: vi.fn().mockResolvedValue({ id: "audit_1" }),
}));

describe("challenge admin repository (FEAT-CHAL-01, FEAT-CHAL-02, FEAT-CHAL-05)", () => {
   beforeEach(() => {
      vi.clearAllMocks();
   });

   describe("listAllChallengesForAdmin", () => {
      it("queries challenges with host, teams, and participant counts", async () => {
         const mockList = [
            {
               id: "c_1",
               title: "Battle",
               startAt: new Date(Date.now() - 3600000),
               endAt: new Date(Date.now() + 7 * 86400000),
            },
         ];
         vi.mocked(prisma.challenge.findMany).mockResolvedValue(
            mockList as never
         );

         const result = await listAllChallengesForAdmin();
         expect(result).toEqual([
            {
               ...mockList[0],
               status: "ACTIVE",
            },
         ]);
         expect(prisma.challenge.findMany).toHaveBeenCalled();
      });
   });

   describe("createAdminChallenge", () => {
      it("creates challenge and teams within transaction with audit logging", async () => {
         const mockCreated = {
            id: "c_new",
            title: "Sprint Battle",
            teams: [{ id: "t_1" }, { id: "t_2" }],
         };
         vi.mocked(prisma.challenge.create).mockResolvedValue(
            mockCreated as never
         );

         const result = await createAdminChallenge(
            {
               title: "Sprint Battle",
               format: "TEAM_VS_TEAM",
               startAt: new Date("2026-09-01T08:00:00Z"),
               endAt: new Date("2026-09-08T08:00:00Z"),
               eventBannerUrl: " https://example.com/banner.webp ",
               punishmentPfpUrl: " https://example.com/pfp.png ",
               teams: [{ name: "Bees" }, { name: "Butterflies" }],
            },
            { id: "admin_1", username: "HostAdmin" }
         );

         expect(result).toEqual(mockCreated);
         expect(prisma.challenge.create).toHaveBeenCalledWith(
            expect.objectContaining({
               data: expect.objectContaining({
                  title: "Sprint Battle",
                  eventBannerUrl: "https://example.com/banner.webp",
                  punishmentPfpUrl: "https://example.com/pfp.png",
               }),
            })
         );
      });
   });

   describe("optional challenge creation images", () => {
      it("stores null for omitted images without deriving a banner from a PFP", async () => {
         vi.mocked(prisma.challenge.create).mockResolvedValue({
            id: "c_new",
            title: "Study Battle",
            format: "SOLOS",
            teams: [],
         } as never);

         await createAdminChallenge(
            {
               title: "Study Battle",
               format: "SOLOS",
               startAt: "2026-09-01T00:00:00.000Z",
               endAt: "2026-09-08T00:00:00.000Z",
               punishmentPfpUrl: "https://example.com/pfp.png",
               teams: [{ name: "Solo" }],
            },
            { id: "admin_1", username: "HostAdmin" }
         );

         expect(prisma.challenge.create).toHaveBeenCalledWith(
            expect.objectContaining({
               data: expect.objectContaining({
                  eventBannerUrl: null,
                  punishmentPfpUrl: "https://example.com/pfp.png",
               }),
            })
         );
      });
   });

   describe("kickoffChallenge", () => {
      it("transitions challenge from UPCOMING to ACTIVE", async () => {
         vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
            id: "c_up",
            startAt: new Date(Date.now() + 86400000),
            endAt: new Date(Date.now() + 7 * 86400000),
         } as never);
         vi.mocked(prisma.challenge.update).mockResolvedValue({
            id: "c_up",
            startAt: new Date(Date.now() - 3600000),
            endAt: new Date(Date.now() + 7 * 86400000),
         } as never);

         const result = await kickoffChallenge("c_up", {
            id: "admin_1",
            username: "HostAdmin",
         });
         expect(result.status).toBe("ACTIVE");
         expect(prisma.challenge.update).toHaveBeenCalledWith(
            expect.objectContaining({
               where: { id: "c_up" },
            })
         );
      });

      it("throws when challenge is already ACTIVE", async () => {
         vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
            id: "c_act",
            startAt: new Date(Date.now() - 3600000),
            endAt: new Date(Date.now() + 7 * 86400000),
         } as never);

         await expect(
            kickoffChallenge("c_act", { id: "admin_1", username: "HostAdmin" })
         ).rejects.toThrow("Challenge is already active.");
      });
   });

   describe("lockChallengeResults", () => {
      it("evaluates dual-failure accountability and locks challenge", async () => {
         vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
            id: "c_act",
            startAt: new Date(Date.now() - 7 * 86400000),
            endAt: new Date(Date.now() + 86400000),
            participants: [
               {
                  id: "p_1",
                  targetSeconds: 36000,
                  status: "NORMAL",
                  dailyStudyLogs: [{ durationSeconds: 30000 }], // 6000s deficit
                  weeklyGoals: [{ id: "g_1", completed: true }],
                  punishmentRecord: null,
               },
            ],
         } as never);

         vi.mocked(prisma.challenge.update).mockResolvedValue({
            id: "c_act",
            startAt: new Date(Date.now() - 7 * 86400000),
            endAt: new Date(Date.now() - 3600000),
         } as never);

         const result = await lockChallengeResults("c_act", {
            id: "admin_1",
            username: "HostAdmin",
         });

         expect(result.status).toBe("COMPLETED");
         expect(prisma.challengeParticipant.update).toHaveBeenCalledWith({
            where: { id: "p_1" },
            data: { status: "PUNISHED" },
         });
         expect(prisma.punishmentRecord.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
               where: { participantId: "p_1" },
               create: expect.objectContaining({
                  isPunished: true,
                  hoursDeficitSeconds: 6000,
               }),
            })
         );
      });
   });

   describe("adminEnrollParticipant", () => {
      it("successfully enrolls user and records audit trail (Law L5)", async () => {
         vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
            id: "c_1",
         } as never);

         vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue(
            null
         );

         vi.mocked(prisma.team.findUnique).mockResolvedValue({
            id: "t_1",
            name: "Butterflies",
            challengeId: "c_1",
            maxMembers: 10,
            _count: { participants: 3 },
         } as never);

         const mockParticipant = {
            id: "part_admin_assigned",
            userId: "u_2",
            challengeId: "c_1",
            teamId: "t_1",
            targetSeconds: 126000,
            status: "NORMAL",
         };

         vi.mocked(prisma.challengeParticipant.create).mockResolvedValue(
            mockParticipant as never
         );

         const result = await adminEnrollParticipant({
            challengeId: "c_1",
            userId: "u_2",
            teamId: "t_1",
            targetSeconds: 126000,
            reason: "Manual host placement from Discord",
            admin: { id: "admin_1", username: "HostAdmin" },
         });

         expect(result).toEqual(mockParticipant);
         expect(prisma.challengeParticipant.create).toHaveBeenCalledWith({
            data: {
               userId: "u_2",
               challengeId: "c_1",
               teamId: "t_1",
               targetSeconds: 126000,
               status: "NORMAL",
            },
            include: {
               team: true,
               challenge: true,
               user: true,
            },
         });
      });

      it("rejects when user is already enrolled", async () => {
         vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
            id: "c_1",
         } as never);

         vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue({
            id: "part_existing",
         } as never);

         await expect(
            adminEnrollParticipant({
               challengeId: "c_1",
               userId: "u_2",
               teamId: "t_1",
               reason: "Host override",
               admin: { id: "admin_1", username: "HostAdmin" },
            })
         ).rejects.toThrow("User is already enrolled in this challenge.");
      });
   });

   describe("updateAdminChallenge", () => {
      it("updates challenge details and teams with audit trail", async () => {
         vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
            id: "c_1",
            title: "Old Title",
            format: "TEAM_VS_TEAM",
            startAt: new Date("2026-09-01"),
            endAt: new Date("2026-09-08"),
            teams: [{ id: "t_1", name: "Old Team" }],
         } as never);

         const mockUpdated = {
            id: "c_1",
            title: "New Title",
            startAt: new Date("2026-09-02"),
            endAt: new Date("2026-09-09"),
         };
         vi.mocked(prisma.challenge.update).mockResolvedValue(
            mockUpdated as never
         );
         vi.mocked(prisma.team.create).mockResolvedValue({
            id: "t_created",
         } as never);

         const result = await updateAdminChallenge(
            "c_1",
            {
               title: "New Title",
               startAt: "2026-09-02T00:00:00.000Z",
               endAt: "2026-09-09T00:00:00.000Z",
               eventBannerUrl: " https://example.com/banner.webp ",
               punishmentPfpUrl: " https://example.com/pfp.png ",
               teams: [
                  {
                     id: "t_1",
                     name: "Updated Bees",
                     color: "#FFB066",
                     iconEmoji: "🐝",
                  },
                  {
                     name: "New Butterflies",
                     color: "#A29DAE",
                     iconEmoji: "🦋",
                  },
               ],
            },
            { id: "admin_1", username: "HostAdmin" }
         );

         expect(result).toEqual(mockUpdated);
         expect(prisma.challenge.update).toHaveBeenCalledWith({
            where: { id: "c_1" },
            data: {
               title: "New Title",
               startAt: new Date("2026-09-02T00:00:00.000Z"),
               endAt: new Date("2026-09-09T00:00:00.000Z"),
               eventBannerUrl: " https://example.com/banner.webp ",
               punishmentPfpUrl: " https://example.com/pfp.png ",
            },
         });
         expect(prisma.team.update).toHaveBeenCalled();
         expect(prisma.team.create).toHaveBeenCalled();
      });
   });

   describe("nullable and legacy challenge image updates", () => {
      it.each([
         { eventBannerUrl: null, punishmentPfpUrl: null },
         {
            eventBannerUrl: "https://example.com/banner.webp",
            punishmentPfpUrl: null,
         },
         {
            eventBannerUrl: null,
            punishmentPfpUrl: "https://example.com/pfp.png",
         },
         { eventBannerUrl: "", punishmentPfpUrl: "   " },
         { eventBannerUrl: "   ", punishmentPfpUrl: "" },
         {
            eventBannerUrl:
               "  https://example.com/legacy-banner.webp?download=banner.webp#preview  ",
            punishmentPfpUrl: "  https://example.com/legacy-pfp.png#avatar  ",
         },
      ])(
         "preserves unchanged raw legacy image fields independently (%j)",
         async (images) => {
            vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
               id: "c_1",
               title: "Study Battle",
               format: "SOLOS",
               startAt: new Date("2026-09-01"),
               endAt: new Date("2026-09-08"),
               teams: [],
               ...images,
            } as never);
            vi.mocked(prisma.challenge.update).mockResolvedValue({
               id: "c_1",
            } as never);

            await updateAdminChallenge(
               "c_1",
               {
                  title: "Study Battle",
                  startAt: "2026-09-01T00:00:00.000Z",
                  endAt: "2026-09-08T00:00:00.000Z",
                  teams: [],
                  ...images,
               },
               { id: "admin_1", username: "HostAdmin" }
            );

            expect(prisma.challenge.update).toHaveBeenCalledWith(
               expect.objectContaining({
                  data: expect.objectContaining(images),
               })
            );
         }
      );
   });

   describe("reassignParticipantTeam", () => {
      it("reassigns a participant to a new team in the challenge", async () => {
         vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue({
            id: "part_1",
            challengeId: "c_1",
            teamId: "t_1",
            team: { id: "t_1", name: "Bees" },
            user: { id: "u_1", displayName: "Afnan", username: "afnan" },
         } as never);

         vi.mocked(prisma.team.findUnique).mockResolvedValue({
            id: "t_2",
            challengeId: "c_1",
            name: "Butterflies",
            maxMembers: null,
            _count: { participants: 3 },
         } as never);

         const mockUpdated = {
            id: "part_1",
            teamId: "t_2",
            team: { id: "t_2", name: "Butterflies" },
            user: { id: "u_1", displayName: "Afnan" },
         };
         vi.mocked(prisma.challengeParticipant.update).mockResolvedValue(
            mockUpdated as never
         );

         const result = await reassignParticipantTeam({
            participantId: "part_1",
            newTeamId: "t_2",
            reason: "Rebalance teams",
            admin: { id: "admin_1", username: "HostAdmin" },
         });

         expect(result).toEqual(mockUpdated);
         expect(prisma.challengeParticipant.update).toHaveBeenCalledWith({
            where: { id: "part_1" },
            data: { teamId: "t_2" },
            include: { team: true, user: true },
         });
      });

      it("rejects when destination team belongs to a different challenge", async () => {
         vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue({
            id: "part_1",
            challengeId: "c_1",
            teamId: "t_1",
            team: { id: "t_1", name: "Bees" },
            user: { id: "u_1", displayName: "Afnan" },
         } as never);

         vi.mocked(prisma.team.findUnique).mockResolvedValue({
            id: "t_other",
            challengeId: "c_other",
            name: "Foreign Team",
            maxMembers: null,
            _count: { participants: 0 },
         } as never);

         await expect(
            reassignParticipantTeam({
               participantId: "part_1",
               newTeamId: "t_other",
               admin: { id: "admin_1", username: "HostAdmin" },
            })
         ).rejects.toThrow(
            "Selected destination team does not belong to this challenge."
         );
      });

      it("unassigns participant when newTeamId is no-assigned", async () => {
         vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue({
            id: "part_1",
            challengeId: "c_1",
            teamId: "t_1",
            team: { id: "t_1", name: "Bees" },
            user: { id: "u_1", displayName: "Afnan", username: "afnan" },
         } as never);

         const mockUnassigned = {
            id: "part_1",
            teamId: null,
            team: null,
            user: { id: "u_1", displayName: "Afnan" },
         };
         vi.mocked(prisma.challengeParticipant.update).mockResolvedValue(
            mockUnassigned as never
         );

         const result = await reassignParticipantTeam({
            participantId: "part_1",
            newTeamId: "no-assigned",
            reason: "Reset to unassigned",
            admin: { id: "admin_1", username: "HostAdmin" },
         });

         expect(result).toEqual(mockUnassigned);
         expect(prisma.challengeParticipant.update).toHaveBeenCalledWith({
            where: { id: "part_1" },
            data: { teamId: null },
            include: { team: true, user: true },
         });
      });
   });

   describe("deleteAdminChallenge", () => {
      it("deletes all related entities and challenge in correct order", async () => {
         vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
            id: "c_1",
            title: "Test Challenge",
            startAt: new Date(Date.now() + 86400000),
            endAt: new Date(Date.now() + 7 * 86400000),
         } as never);

         const mockDeleted = { id: "c_1", title: "Test Challenge" };
         vi.mocked(prisma.challenge.delete).mockResolvedValue(
            mockDeleted as never
         );

         const result = await deleteAdminChallenge("c_1", {
            id: "admin_1",
            username: "HostAdmin",
         });

         expect(result).toEqual(mockDeleted);
         expect(prisma.dailyStudyLog.deleteMany).toHaveBeenCalled();
         expect(prisma.punishmentRecord.deleteMany).toHaveBeenCalled();
         expect(prisma.leaderboardEntry.deleteMany).toHaveBeenCalled();
         expect(prisma.challengeParticipant.deleteMany).toHaveBeenCalled();
         expect(prisma.teamMember.deleteMany).toHaveBeenCalled();
         expect(prisma.team.deleteMany).toHaveBeenCalled();
         expect(prisma.challenge.delete).toHaveBeenCalledWith({
            where: { id: "c_1" },
         });
      });
   });

   describe("adminUpdateParticipantTarget (Law L5 / FEAT-DECL-04)", () => {
      it("successfully updates participant target hours and records audit log", async () => {
         const mockParticipant = {
            id: "p_1",
            challengeId: "c_1",
            userId: "u_1",
            targetSeconds: 72000,
            user: { displayName: "Alice", username: "alice" },
            team: { name: "Bees" },
         };
         const mockUpdated = {
            ...mockParticipant,
            targetSeconds: 90000,
         };

         vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue(
            mockParticipant as never
         );
         vi.mocked(prisma.challengeParticipant.update).mockResolvedValue(
            mockUpdated as never
         );

         const result = await adminUpdateParticipantTarget({
            challengeId: "c_1",
            participantId: "p_1",
            targetSeconds: 90000,
            reason: "Adjusted due to illness accommodation",
            admin: { id: "admin_1", username: "HostAdmin" },
         });

         expect(result.targetSeconds).toBe(90000);
         expect(prisma.challengeParticipant.update).toHaveBeenCalledWith({
            where: { id: "p_1" },
            data: { targetSeconds: 90000 },
            include: { user: true, team: true, challenge: true },
         });
      });

      it("rejects when participant is not found", async () => {
         vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue(
            null
         );

         await expect(
            adminUpdateParticipantTarget({
               challengeId: "c_1",
               participantId: "nonexistent",
               targetSeconds: 90000,
               admin: { id: "admin_1", username: "HostAdmin" },
            })
         ).rejects.toThrow("Participant not found.");
      });

      it("rejects when participant belongs to a different challenge", async () => {
         vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue({
            id: "p_1",
            challengeId: "other_challenge",
         } as never);

         await expect(
            adminUpdateParticipantTarget({
               challengeId: "c_1",
               participantId: "p_1",
               targetSeconds: 90000,
               admin: { id: "admin_1", username: "HostAdmin" },
            })
         ).rejects.toThrow("Participant does not belong to this challenge.");
      });
   });
});
