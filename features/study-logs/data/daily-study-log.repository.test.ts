import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/core/db";
import {
  findDailyLog,
  upsertDailyStudyLog,
} from "@/features/study-logs/data/daily-study-log.repository";

vi.mock("@/core/db", () => ({
  prisma: {
    dailyStudyLog: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("dailyStudyLog repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("upsertDailyStudyLog", () => {
    it("normalizes date string to UTC date-only and performs upsert", async () => {
      const mockResult = {
        id: "log_1",
        participantId: "part_1",
        logDate: new Date("2026-09-06T00:00:00.000Z"),
        durationSeconds: 16_200,
        isOverride: false,
      };

      vi.mocked(prisma.dailyStudyLog.upsert).mockResolvedValue(mockResult as never);

      const result = await upsertDailyStudyLog({
        participantId: "part_1",
        logDate: "2026-09-06",
        durationSeconds: 16_200,
      });

      expect(result).toEqual(mockResult);

      const expectedUtcDate = new Date(Date.UTC(2026, 8, 6));
      expect(prisma.dailyStudyLog.upsert).toHaveBeenCalledWith({
        where: {
          participantId_logDate: {
            participantId: "part_1",
            logDate: expectedUtcDate,
          },
        },
        create: {
          participantId: "part_1",
          logDate: expectedUtcDate,
          durationSeconds: 16_200,
        },
        update: {
          durationSeconds: 16_200,
          isOverride: false,
          overrideById: null,
          overrideReason: null,
        },
      });
    });

    it("resets override flags on self-logging update", async () => {
      vi.mocked(prisma.dailyStudyLog.upsert).mockResolvedValue({} as never);

      await upsertDailyStudyLog({
        participantId: "part_2",
        logDate: new Date("2026-09-07T14:30:00.000Z"),
        durationSeconds: 7_200,
      });

      const callArgs = vi.mocked(prisma.dailyStudyLog.upsert).mock.calls[0][0];
      expect(callArgs.update).toEqual({
        durationSeconds: 7_200,
        isOverride: false,
        overrideById: null,
        overrideReason: null,
      });
    });
  });

  describe("findDailyLog", () => {
    it("queries by composite unique constraint (participantId + normalized logDate)", async () => {
      const mockLog = {
        id: "log_3",
        participantId: "part_3",
        logDate: new Date("2026-09-08T00:00:00.000Z"),
        durationSeconds: 3_600,
      };

      vi.mocked(prisma.dailyStudyLog.findUnique).mockResolvedValue(mockLog as never);

      const log = await findDailyLog("part_3", "2026-09-08");
      expect(log).toEqual(mockLog);

      const expectedUtcDate = new Date(Date.UTC(2026, 8, 8));
      expect(prisma.dailyStudyLog.findUnique).toHaveBeenCalledWith({
        where: {
          participantId_logDate: {
            participantId: "part_3",
            logDate: expectedUtcDate,
          },
        },
      });
    });
  });
});

