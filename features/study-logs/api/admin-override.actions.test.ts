import { beforeEach, describe, expect, it, vi } from "vitest";

import {
   adminOverrideStudyHoursAction,
   adminResetParticipantOverallHoursAction,
} from "./admin-override.actions";
import * as requireAdminModule from "@/features/auth/api/require-admin";
import * as overrideRepoModule from "@/features/study-logs/data/admin-override.repository";

vi.mock("next/cache", () => ({
   revalidatePath: vi.fn(),
   revalidateTag: vi.fn(),
}));

vi.mock("@/features/auth/api/require-admin", () => ({
   AdminAccessError: class AdminAccessError extends Error {},
   requireAdminUser: vi.fn(),
}));

vi.mock("@/features/study-logs/data/admin-override.repository", () => ({
   executeAdminHoursOverride: vi.fn(),
   executeAdminResetOverallHours: vi.fn(),
}));

describe("adminOverrideStudyHoursAction (Law L5 / FEAT-LOG-04)", () => {
   beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(requireAdminModule.requireAdminUser).mockResolvedValue({
         id: "admin_1",
         username: "HostAdmin",
         displayName: "Host Admin",
         role: "ADMIN",
      });
   });

   it("successfully records hours override with valid duration and audit reason", async () => {
      vi.mocked(overrideRepoModule.executeAdminHoursOverride).mockResolvedValue(
         {} as never
      );

      const result = await adminOverrideStudyHoursAction({
         challengeId: "c_1",
         participantId: "p_1",
         logDate: "2026-09-05",
         hours: 4,
         minutes: 30,
         seconds: 0,
         reason: "Timer app crashed during evening session",
      });

      expect(result).toEqual({ ok: true });
      expect(overrideRepoModule.executeAdminHoursOverride).toHaveBeenCalledWith(
         {
            participantId: "p_1",
            logDate: "2026-09-05",
            durationSeconds: 16200,
            reason: "Timer app crashed during evening session",
            admin: { id: "admin_1", username: "HostAdmin" },
         }
      );
   });

   it("rejects duration exceeding 24 hours (86,400s)", async () => {
      const result = await adminOverrideStudyHoursAction({
         challengeId: "c_1",
         participantId: "p_1",
         logDate: "2026-09-05",
         hours: 24,
         minutes: 1,
         seconds: 0,
         reason: "Typo test",
      });

      expect(result.ok).toBe(false);
      expect(result).toMatchObject({
         code: "DAILY_LIMIT_EXCEEDED",
      });
   });

   it("rejects when reason is too short", async () => {
      const result = await adminOverrideStudyHoursAction({
         challengeId: "c_1",
         participantId: "p_1",
         logDate: "2026-09-05",
         hours: 2,
         minutes: 0,
         seconds: 0,
         reason: "a",
      });

      expect(result.ok).toBe(false);
      expect(result).toMatchObject({
         code: "INVALID_INPUT",
      });
   });

   it("STRICTLY REJECTS future dates with FUTURE_DATE_NOT_ALLOWED even for moderators", async () => {
      // Tomorrow or far future date
      const futureDate = "2099-12-31";

      const result = await adminOverrideStudyHoursAction({
         challengeId: "c_1",
         participantId: "p_1",
         logDate: futureDate,
         hours: 3,
         minutes: 0,
         seconds: 0,
         reason: "Trying to log future study session",
      });

      expect(result.ok).toBe(false);
      expect(result).toEqual({
         ok: false,
         code: "FUTURE_DATE_NOT_ALLOWED",
         message: "Cannot log or edit study time for future dates.",
      });
      expect(
         overrideRepoModule.executeAdminHoursOverride
      ).not.toHaveBeenCalled();
   });

   it("allows clearing time to 00:00:00 and defaults reason when omitted", async () => {
      vi.mocked(overrideRepoModule.executeAdminHoursOverride).mockResolvedValue(
         {} as never
      );

      const result = await adminOverrideStudyHoursAction({
         challengeId: "c_1",
         participantId: "p_1",
         logDate: "2026-09-05",
         hours: 0,
         minutes: 0,
         seconds: 0,
         reason: "",
      });

      expect(result).toEqual({ ok: true });
      expect(overrideRepoModule.executeAdminHoursOverride).toHaveBeenCalledWith(
         {
            participantId: "p_1",
            logDate: "2026-09-05",
            durationSeconds: 0,
            reason: "Set study hours to 00:00:00 by moderator",
            admin: { id: "admin_1", username: "HostAdmin" },
         }
      );
   });

   it("allows setting 00:00:00 with explicit reason", async () => {
      vi.mocked(overrideRepoModule.executeAdminHoursOverride).mockResolvedValue(
         {} as never
      );

      const result = await adminOverrideStudyHoursAction({
         challengeId: "c_1",
         participantId: "p_1",
         logDate: "2026-09-05",
         hours: 0,
         minutes: 0,
         seconds: 0,
         reason: "Timer malfunction reset",
      });

      expect(result).toEqual({ ok: true });
      expect(overrideRepoModule.executeAdminHoursOverride).toHaveBeenCalledWith(
         {
            participantId: "p_1",
            logDate: "2026-09-05",
            durationSeconds: 0,
            reason: "Timer malfunction reset",
            admin: { id: "admin_1", username: "HostAdmin" },
         }
      );
   });
});

describe("adminResetParticipantOverallHoursAction (Law L5 / FEAT-LOG-04)", () => {
   beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(requireAdminModule.requireAdminUser).mockResolvedValue({
         id: "admin_1",
         username: "HostAdmin",
         displayName: "Host Admin",
         role: "ADMIN",
      });
   });

   it("successfully resets overall participant hours with default reason when reason omitted", async () => {
      vi.mocked(
         overrideRepoModule.executeAdminResetOverallHours
      ).mockResolvedValue({
         participantId: "p_1",
         previousTotalSeconds: 14400,
         resetCount: 2,
      } as never);

      const result = await adminResetParticipantOverallHoursAction({
         challengeId: "c_1",
         participantId: "p_1",
      });

      expect(result).toEqual({ ok: true });
      expect(
         overrideRepoModule.executeAdminResetOverallHours
      ).toHaveBeenCalledWith({
         participantId: "p_1",
         challengeId: "c_1",
         reason: "Reset overall study hours to 00:00:00 by moderator",
         admin: { id: "admin_1", username: "HostAdmin" },
      });
   });

   it("successfully resets overall participant hours with custom reason", async () => {
      vi.mocked(
         overrideRepoModule.executeAdminResetOverallHours
      ).mockResolvedValue({
         participantId: "p_1",
         previousTotalSeconds: 7200,
         resetCount: 1,
      } as never);

      const result = await adminResetParticipantOverallHoursAction({
         challengeId: "c_1",
         participantId: "p_1",
         reason: "Disqualified previous entries",
      });

      expect(result).toEqual({ ok: true });
      expect(
         overrideRepoModule.executeAdminResetOverallHours
      ).toHaveBeenCalledWith({
         participantId: "p_1",
         challengeId: "c_1",
         reason: "Disqualified previous entries",
         admin: { id: "admin_1", username: "HostAdmin" },
      });
   });

   it("rejects invalid input schema", async () => {
      const result = await adminResetParticipantOverallHoursAction({
         challengeId: "",
         participantId: "p_1",
      });

      expect(result.ok).toBe(false);
      expect(result).toMatchObject({
         code: "INVALID_INPUT",
      });
   });
});
