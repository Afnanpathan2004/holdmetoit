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
    weeklyGoal: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    challengeParticipant: {
      update: vi.fn(),
    },
  },
}));

describe("weeklyGoal repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("replaceWeeklyGoals", () => {
    it("deletes previous goals and creates ordered goals within a transaction", async () => {
      const mockTx = {
        weeklyGoal: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          createMany: vi.fn().mockResolvedValue({ count: 3 }),
          findMany: vi.fn().mockResolvedValue([
            { id: "g1", description: "Goal 1", sortOrder: 0 },
            { id: "g2", description: "Goal 2", sortOrder: 1 },
            { id: "g3", description: "Goal 3", sortOrder: 2 },
          ]),
        },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback(mockTx as never);
      });

      const goals = await replaceWeeklyGoals("part_1", [
        "Goal 1",
        "Goal 2",
        "Goal 3",
      ]);

      expect(mockTx.weeklyGoal.deleteMany).toHaveBeenCalledWith({
        where: { participantId: "part_1" },
      });

      expect(mockTx.weeklyGoal.createMany).toHaveBeenCalledWith({
        data: [
          { participantId: "part_1", description: "Goal 1", sortOrder: 0 },
          { participantId: "part_1", description: "Goal 2", sortOrder: 1 },
          { participantId: "part_1", description: "Goal 3", sortOrder: 2 },
        ],
      });

      expect(mockTx.weeklyGoal.findMany).toHaveBeenCalledWith({
        where: { participantId: "part_1" },
        orderBy: { sortOrder: "asc" },
      });

      expect(goals).toHaveLength(3);
    });
  });

  describe("setWeeklyGoalCompleted", () => {
    it("updates goal completed status when goal belongs to participant", async () => {
      const existingGoal = {
        id: "g_1",
        participantId: "part_1",
        description: "Finish physics",
        completed: false,
      };

      vi.mocked(prisma.weeklyGoal.findFirst).mockResolvedValue(existingGoal as never);
      vi.mocked(prisma.weeklyGoal.update).mockResolvedValue({
        ...existingGoal,
        completed: true,
        completedAt: new Date(),
      } as never);

      const updated = await setWeeklyGoalCompleted("part_1", "g_1", true);

      expect(prisma.weeklyGoal.findFirst).toHaveBeenCalledWith({
        where: { id: "g_1", participantId: "part_1" },
      });

      expect(prisma.weeklyGoal.update).toHaveBeenCalledWith({
        where: { id: "g_1" },
        data: {
          completed: true,
          completedAt: expect.any(Date),
        },
      });

      expect(updated?.completed).toBe(true);
    });

    it("returns null when goal does not belong to the participant", async () => {
      vi.mocked(prisma.weeklyGoal.findFirst).mockResolvedValue(null);

      const result = await setWeeklyGoalCompleted("part_other", "g_1", true);

      expect(result).toBeNull();
      expect(prisma.weeklyGoal.update).not.toHaveBeenCalled();
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

