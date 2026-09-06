import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/core/db";
import {
  createAdminChallenge,
  kickoffChallenge,
  listAllChallengesForAdmin,
  lockChallengeResults,
} from "./challenge-admin.repository";

vi.mock("@/core/db", () => ({
  prisma: {
    challenge: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    challengeParticipant: {
      update: vi.fn(),
    },
    punishmentRecord: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe("challenge admin repository (FEAT-CHAL-01, FEAT-CHAL-02, FEAT-CHAL-05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listAllChallengesForAdmin", () => {
    it("queries challenges with host, teams, and participant counts", async () => {
      const mockList = [{ id: "c_1", title: "Battle" }];
      vi.mocked(prisma.challenge.findMany).mockResolvedValue(mockList as never);

      const result = await listAllChallengesForAdmin();
      expect(result).toEqual(mockList);
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
      vi.mocked(prisma.challenge.create).mockResolvedValue(mockCreated as never);

      const result = await createAdminChallenge(
        {
          title: "Sprint Battle",
          format: "TEAM_VS_TEAM",
          startAt: new Date("2026-09-01T08:00:00Z"),
          endAt: new Date("2026-09-08T08:00:00Z"),
          teams: [{ name: "Bees" }, { name: "Butterflies" }],
        },
        { id: "admin_1", username: "HostAdmin" },
      );

      expect(result).toEqual(mockCreated);
      expect(prisma.challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Sprint Battle",
            status: "UPCOMING",
          }),
        }),
      );
    });
  });

  describe("kickoffChallenge", () => {
    it("transitions challenge from UPCOMING to ACTIVE", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "c_up",
        status: "UPCOMING",
      } as never);
      vi.mocked(prisma.challenge.update).mockResolvedValue({
        id: "c_up",
        status: "ACTIVE",
      } as never);

      const result = await kickoffChallenge("c_up", {
        id: "admin_1",
        username: "HostAdmin",
      });
      expect(result.status).toBe("ACTIVE");
      expect(prisma.challenge.update).toHaveBeenCalledWith({
        where: { id: "c_up" },
        data: { status: "ACTIVE" },
      });
    });

    it("throws when challenge is already ACTIVE", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "c_act",
        status: "ACTIVE",
      } as never);

      await expect(
        kickoffChallenge("c_act", { id: "admin_1", username: "HostAdmin" }),
      ).rejects.toThrow("Challenge is already active.");
    });
  });

  describe("lockChallengeResults", () => {
    it("evaluates dual-failure accountability and locks challenge", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "c_act",
        status: "ACTIVE",
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
        status: "COMPLETED",
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
        }),
      );
    });
  });
});
