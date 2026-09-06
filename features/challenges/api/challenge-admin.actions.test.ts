import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  adminEnrollParticipantAction,
  kickoffChallengeAction,
  lockChallengeResultsAction,
} from "@/features/challenges/api/challenge-admin.actions";
import * as requireAdminModule from "@/features/auth/api/require-admin";
import * as challengeAdminRepo from "@/features/challenges/data/challenge-admin.repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/api/require-admin", () => ({
  AdminAccessError: class AdminAccessError extends Error {
    readonly code = "FORBIDDEN_NOT_ADMIN";
  },
  requireAdminUser: vi.fn(),
}));

vi.mock("@/features/challenges/data/challenge-admin.repository", () => ({
  kickoffChallenge: vi.fn(),
  lockChallengeResults: vi.fn(),
  adminEnrollParticipant: vi.fn(),
}));

describe("challenge-admin actions (FEAT-CHAL-02, FEAT-CHAL-05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("adminEnrollParticipantAction", () => {
    it("successfully enrolls user into team when called by admin", async () => {
      vi.mocked(requireAdminModule.requireAdminUser).mockResolvedValue({
        id: "admin_1",
        username: "HostAdmin",
      } as never);

      vi.mocked(challengeAdminRepo.adminEnrollParticipant).mockResolvedValue({
        id: "part_new",
      } as never);

      const result = await adminEnrollParticipantAction({
        challengeId: "c_1",
        userId: "u_2",
        teamId: "t_1",
        targetSeconds: 126000,
        reason: "Host Discord assignment",
      });

      expect(result).toEqual({ ok: true });
      expect(challengeAdminRepo.adminEnrollParticipant).toHaveBeenCalledWith({
        challengeId: "c_1",
        userId: "u_2",
        teamId: "t_1",
        targetSeconds: 126000,
        reason: "Host Discord assignment",
        admin: { id: "admin_1", username: "HostAdmin" },
      });
    });

    it("rejects when reason is too short", async () => {
      vi.mocked(requireAdminModule.requireAdminUser).mockResolvedValue({
        id: "admin_1",
        username: "HostAdmin",
      } as never);

      const result = await adminEnrollParticipantAction({
        challengeId: "c_1",
        userId: "u_2",
        teamId: "t_1",
        targetSeconds: 126000,
        reason: "ab",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("INVALID_INPUT");
      }
      expect(challengeAdminRepo.adminEnrollParticipant).not.toHaveBeenCalled();
    });

    it("rejects non-admin caller with FORBIDDEN_NOT_ADMIN", async () => {
      vi.mocked(requireAdminModule.requireAdminUser).mockRejectedValue(
        new requireAdminModule.AdminAccessError(),
      );

      const result = await adminEnrollParticipantAction({
        challengeId: "c_1",
        userId: "u_2",
        teamId: "t_1",
        targetSeconds: 126000,
        reason: "Manual assignment",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("FORBIDDEN_NOT_ADMIN");
      }
    });
  });

  describe("kickoffChallengeAction", () => {
    it("transitions challenge status to ACTIVE", async () => {
      vi.mocked(requireAdminModule.requireAdminUser).mockResolvedValue({
        id: "admin_1",
        username: "HostAdmin",
      } as never);

      vi.mocked(challengeAdminRepo.kickoffChallenge).mockResolvedValue({
        id: "c_1",
        status: "ACTIVE",
      } as never);

      const result = await kickoffChallengeAction("c_1");
      expect(result).toEqual({ ok: true });
      expect(challengeAdminRepo.kickoffChallenge).toHaveBeenCalledWith("c_1", {
        id: "admin_1",
        username: "HostAdmin",
      });
    });
  });

  describe("lockChallengeResultsAction", () => {
    it("locks final challenge results", async () => {
      vi.mocked(requireAdminModule.requireAdminUser).mockResolvedValue({
        id: "admin_1",
        username: "HostAdmin",
      } as never);

      vi.mocked(challengeAdminRepo.lockChallengeResults).mockResolvedValue({
        id: "c_1",
        status: "COMPLETED",
      } as never);

      const result = await lockChallengeResultsAction("c_1");
      expect(result).toEqual({ ok: true });
      expect(challengeAdminRepo.lockChallengeResults).toHaveBeenCalledWith("c_1", {
        id: "admin_1",
        username: "HostAdmin",
      });
    });
  });
});
