import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/core/db";
import { recordAuditEvent } from "@/features/audit/data/audit-log.repository";
import {
   findDailyLog,
   upsertDailyStudyLog,
} from "@/features/study-logs/data/daily-study-log.repository";

vi.mock("@/features/audit/data/audit-log.repository", () => ({
   recordAuditEvent: vi.fn().mockResolvedValue({ id: "audit_1" }),
}));

vi.mock("@/core/db", () => ({
   prisma: {
      dailyStudyLogV2: {
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

         vi.mocked(prisma.dailyStudyLogV2.upsert).mockResolvedValue(
            mockResult as never
         );

         const result = await upsertDailyStudyLog({
            participantId: "part_1",
            logDate: "2026-09-06",
            durationSeconds: 16_200,
         });

         expect(result).toEqual(mockResult);

         const expectedUtcDate = new Date(Date.UTC(2026, 8, 6));
         expect(prisma.dailyStudyLogV2.upsert).toHaveBeenCalledWith({
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
               isLeave: false,
               status: "Offline",
            },
            update: {
               durationSeconds: 16_200,
               isLeave: false,
               isOverride: false,
               overrideById: null,
               overrideReason: null,
            },
         });
      });

      it("resets override flags on self-logging update", async () => {
         vi.mocked(prisma.dailyStudyLogV2.upsert).mockResolvedValue(
            {} as never
         );

         await upsertDailyStudyLog({
            participantId: "part_2",
            logDate: new Date("2026-09-07T14:30:00.000Z"),
            durationSeconds: 7_200,
         });

         const callArgs = vi.mocked(prisma.dailyStudyLogV2.upsert).mock
            .calls[0][0];
         expect(callArgs.update).toEqual({
            durationSeconds: 7_200,
            isLeave: false,
            isOverride: false,
            overrideById: null,
            overrideReason: null,
         });
      });

      it("persists isLeave when marked as leave", async () => {
         vi.mocked(prisma.dailyStudyLogV2.upsert).mockResolvedValue(
            {} as never
         );

         await upsertDailyStudyLog({
            participantId: "part_3",
            logDate: "2026-09-08",
            durationSeconds: 0,
            isLeave: true,
         });

         const callArgs = vi.mocked(prisma.dailyStudyLogV2.upsert).mock
            .calls[0][0];
         expect(callArgs.create.isLeave).toBe(true);
         expect(callArgs.update.isLeave).toBe(true);
      });

      it("records a STUDY_LOG_ADDED audit event on initial study log creation", async () => {
         const mockResult = {
            id: "log_new",
            participantId: "part_1",
            logDate: new Date("2026-09-06T00:00:00.000Z"),
            durationSeconds: 7_200,
            isOverride: false,
         };

         vi.mocked(prisma.dailyStudyLogV2.findUnique).mockResolvedValue(null);
         vi.mocked(prisma.dailyStudyLogV2.upsert).mockResolvedValue(
            mockResult as never
         );

         await upsertDailyStudyLog({
            participantId: "part_1",
            challengeId: "chal_1",
            logDate: "2026-09-06",
            durationSeconds: 7_200,
            actor: {
               id: "usr_1",
               username: "learner",
               displayName: "Active Learner",
               image: "https://cdn.discordapp.com/avatar.png",
            },
         });

         expect(recordAuditEvent).toHaveBeenCalledWith({
            actorId: "usr_1",
            actorUsername: "learner",
            actorDisplayName: "Active Learner",
            actorImage: "https://cdn.discordapp.com/avatar.png",
            actionType: "STUDY_LOG_ADDED",
            targetEntityId: "log_new",
            targetEntityType: "DAILY_STUDY_LOG",
            targetEntityName: "Active Learner",
            challengeId: "chal_1",
            previousValue: null,
            newValue: {
               durationSeconds: 7_200,
               durationClock: "02:00:00",
               logDate: "2026-09-06",
            },
            auditReason: "Logged 02:00:00 of study time",
         });
      });

      it("records a STUDY_LOG_ADDED audit event with previous duration on study log update", async () => {
         const existingLog = {
            id: "log_existing",
            participantId: "part_1",
            logDate: new Date("2026-09-06T00:00:00.000Z"),
            durationSeconds: 3_600,
            isOverride: false,
         };

         const updatedResult = {
            id: "log_existing",
            participantId: "part_1",
            logDate: new Date("2026-09-06T00:00:00.000Z"),
            durationSeconds: 7_200,
            isOverride: false,
         };

         vi.mocked(prisma.dailyStudyLogV2.findUnique).mockResolvedValue(
            existingLog as never
         );
         vi.mocked(prisma.dailyStudyLogV2.upsert).mockResolvedValue(
            updatedResult as never
         );

         await upsertDailyStudyLog({
            participantId: "part_1",
            challengeId: "chal_1",
            logDate: "2026-09-06",
            durationSeconds: 7_200,
            actor: {
               id: "usr_1",
               username: "learner",
               displayName: "Active Learner",
            },
         });

         expect(recordAuditEvent).toHaveBeenCalledWith({
            actorId: "usr_1",
            actorUsername: "learner",
            actorDisplayName: "Active Learner",
            actorImage: null,
            actionType: "STUDY_LOG_ADDED",
            targetEntityId: "log_existing",
            targetEntityType: "DAILY_STUDY_LOG",
            targetEntityName: "Active Learner",
            challengeId: "chal_1",
            previousValue: {
               durationSeconds: 3_600,
               durationClock: "01:00:00",
               logDate: "2026-09-06",
            },
            newValue: {
               durationSeconds: 7_200,
               durationClock: "02:00:00",
               logDate: "2026-09-06",
            },
            auditReason: "Updated study time from 01:00:00 to 02:00:00",
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

         vi.mocked(prisma.dailyStudyLogV2.findUnique).mockResolvedValue(
            mockLog as never
         );

         const log = await findDailyLog("part_3", "2026-09-08");
         expect(log).toEqual(mockLog);

         const expectedUtcDate = new Date(Date.UTC(2026, 8, 8));
         expect(prisma.dailyStudyLogV2.findUnique).toHaveBeenCalledWith({
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
