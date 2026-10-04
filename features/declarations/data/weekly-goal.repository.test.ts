import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/core/db";
import {
  replaceWeeklyGoals,
  setWeeklyGoalCompleted,
  updateParticipantTargetSeconds,
} from "@/features/declarations/data/weekly-goal.repository";

vi.mock("@/core/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    challengeParticipant: {
      update: vi.fn(),
    },
  },
}));

describe("weekly-goal.repository (legacy stub & target updater)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("replaceWeeklyGoals", () => {
    it("returns empty array as legacy weekly goals are superseded by tasks", async () => {
      const result = await replaceWeeklyGoals("part_1", ["Goal 1"]);
      expect(result).toEqual([]);
    });
  });

  describe("setWeeklyGoalCompleted", () => {
    it("returns null as legacy weekly goals are superseded by tasks", async () => {
      const result = await setWeeklyGoalCompleted("part_1", "g_1", true);
      expect(result).toBeNull();
    });
  });

  describe("updateParticipantTargetSeconds", () => {
    it("updates targetSeconds for the participant", async () => {
      vi.mocked(prisma.challengeParticipant.update).mockResolvedValue({
        id: "part_1",
        targetSeconds: 126_000,
      } as never);

      const result = await updateParticipantTargetSeconds("part_1", 126_000);

      expect(prisma.challengeParticipant.update).toHaveBeenCalledWith({
        where: { id: "part_1" },
        data: { targetSeconds: 126_000 },
      });
      expect(result.targetSeconds).toBe(126_000);
    });
  });
});
