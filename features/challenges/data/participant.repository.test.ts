import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/core/db";
import {
  enrollParticipantInChallenge,
  findOwnedParticipant,
  findParticipantForUser,
} from "@/features/challenges/data/participant.repository";

vi.mock("@/core/db", () => ({
  prisma: {
    challenge: {
      findUnique: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
    },
    challengeParticipant: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("participant repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findParticipantForUser", () => {
    it("queries by specific challengeId when provided", async () => {
      const mockParticipant = { id: "part_1", challengeId: "chal_1", userId: "u_1" };
      vi.mocked(prisma.challengeParticipant.findFirst).mockResolvedValue(
        mockParticipant as never,
      );

      const result = await findParticipantForUser("u_1", "chal_1");
      expect(result).toEqual(mockParticipant);
      expect(prisma.challengeParticipant.findFirst).toHaveBeenCalledWith({
        where: { userId: "u_1", challengeId: "chal_1" },
        include: {
          challenge: true,
          team: true,
          user: true,
          dailyStudyLogs: { orderBy: { logDate: "asc" } },
          weeklyGoals: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    it("prefers active challenge when challengeId is not specified", async () => {
      const activeParticipant = {
        id: "part_active",
        challenge: { status: "ACTIVE" },
      };
      vi.mocked(prisma.challengeParticipant.findFirst).mockResolvedValue(
        activeParticipant as never,
      );

      const result = await findParticipantForUser("u_1");
      expect(result).toEqual(activeParticipant);
      expect(prisma.challengeParticipant.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "u_1",
            challenge: { status: "ACTIVE" },
          },
        }),
      );
    });

    it("falls back to upcoming challenge when no active challenge is found", async () => {
      const upcomingParticipant = {
        id: "part_upcoming",
        challenge: { status: "UPCOMING" },
      };

      vi.mocked(prisma.challengeParticipant.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(upcomingParticipant as never);

      const result = await findParticipantForUser("u_1");
      expect(result).toEqual(upcomingParticipant);
      expect(prisma.challengeParticipant.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe("findOwnedParticipant", () => {
    it("queries participant by composite userId and challengeId", async () => {
      const mockRecord = {
        id: "part_1",
        userId: "u_1",
        challengeId: "c_1",
        challenge: { id: "c_1", status: "ACTIVE" },
      };

      vi.mocked(prisma.challengeParticipant.findFirst).mockResolvedValue(
        mockRecord as never,
      );

      const result = await findOwnedParticipant("u_1", "c_1");
      expect(result).toEqual(mockRecord);
      expect(prisma.challengeParticipant.findFirst).toHaveBeenCalledWith({
        where: { userId: "u_1", challengeId: "c_1" },
        include: { challenge: true },
      });
    });
  });

  describe("enrollParticipantInChallenge", () => {
    it("successfully enrolls a user into an upcoming challenge", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "c_1",
        status: "UPCOMING",
      } as never);

      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.team.findUnique).mockResolvedValue({
        id: "t_1",
        name: "Solar",
        challengeId: "c_1",
        maxMembers: 5,
        _count: { participants: 2 },
      } as never);

      const createdParticipant = {
        id: "part_new",
        userId: "u_1",
        challengeId: "c_1",
        teamId: "t_1",
        targetSeconds: 126000,
        status: "NORMAL",
      };

      vi.mocked(prisma.challengeParticipant.create).mockResolvedValue(
        createdParticipant as never,
      );

      const result = await enrollParticipantInChallenge({
        challengeId: "c_1",
        userId: "u_1",
        teamId: "t_1",
        targetSeconds: 126000,
      });

      expect(result).toEqual(createdParticipant);
      expect(prisma.challengeParticipant.create).toHaveBeenCalledWith({
        data: {
          userId: "u_1",
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

    it("rejects enrollment when challenge is COMPLETED", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "c_1",
        status: "COMPLETED",
      } as never);

      await expect(
        enrollParticipantInChallenge({
          challengeId: "c_1",
          userId: "u_1",
          teamId: "t_1",
          targetSeconds: 126000,
        }),
      ).rejects.toThrow("Cannot enroll in a completed challenge.");
    });

    it("rejects enrollment when user is already enrolled", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "c_1",
        status: "UPCOMING",
      } as never);

      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue({
        id: "part_existing",
      } as never);

      await expect(
        enrollParticipantInChallenge({
          challengeId: "c_1",
          userId: "u_1",
          teamId: "t_1",
          targetSeconds: 126000,
        }),
      ).rejects.toThrow("User is already enrolled in this challenge.");
    });

    it("rejects enrollment when selected team is full", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "c_1",
        status: "UPCOMING",
      } as never);

      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.team.findUnique).mockResolvedValue({
        id: "t_1",
        name: "Solar",
        challengeId: "c_1",
        maxMembers: 2,
        _count: { participants: 2 },
      } as never);

      await expect(
        enrollParticipantInChallenge({
          challengeId: "c_1",
          userId: "u_1",
          teamId: "t_1",
          targetSeconds: 126000,
        }),
      ).rejects.toThrow("Team Solar is full (max 2 members).");
    });
  });
});

