import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/core/db";
import {
  findOwnedParticipant,
  findParticipantForUser,
} from "@/features/challenges/data/participant.repository";

vi.mock("@/core/db", () => ({
  prisma: {
    challengeParticipant: {
      findFirst: vi.fn(),
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
});

