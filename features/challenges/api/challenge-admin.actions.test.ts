import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChallengeAction,
  enrollParticipantAction,
  finalizeChallengeAction,
  kickoffChallengeAction,
  renameDuoTeamAction,
} from "./challenge-admin.actions";
import * as requireAdminModule from "@/features/auth/api/require-admin";
import * as adminChallengeRepo from "@/features/challenges/data/admin-challenge.repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/api/require-admin", () => ({
  requireAdminOrHost: vi.fn(),
  AdminAccessError: class AdminAccessError extends Error {},
}));

vi.mock("@/features/challenges/data/admin-challenge.repository", () => ({
  createChallenge: vi.fn(),
  kickoffChallenge: vi.fn(),
  finalizeChallenge: vi.fn(),
  enrollParticipant: vi.fn(),
  renameDuoTeam: vi.fn(),
}));

describe("challenge-admin.actions", () => {
  const mockAdmin = { id: "admin-1", username: "host_alex", name: "Host Alex", role: "ADMIN" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminModule.requireAdminOrHost).mockResolvedValue(mockAdmin as any);
  });

  describe("createChallengeAction", () => {
    it("creates challenge when valid input is provided", async () => {
      vi.mocked(adminChallengeRepo.createChallenge).mockResolvedValueOnce({
        id: "chal-new",
      } as any);

      const result = await createChallengeAction({
        title: "Winter Study Duel",
        format: "TEAM_VS_TEAM",
        startAt: "2026-10-01T00:00:00Z",
        endAt: "2026-10-08T00:00:00Z",
        teams: [{ name: "Owls" }, { name: "Larks" }],
      });

      expect(result).toEqual({ ok: true, challengeId: "chal-new" });
      expect(adminChallengeRepo.createChallenge).toHaveBeenCalled();
    });

    it("rejects invalid input schema", async () => {
      const result = await createChallengeAction({
        title: "", // empty
        format: "TEAM_VS_TEAM",
        startAt: "invalid",
        endAt: "invalid",
        teams: [],
      });

      expect(result.ok).toBe(false);
      expect(adminChallengeRepo.createChallenge).not.toHaveBeenCalled();
    });
  });

  describe("kickoffChallengeAction", () => {
    it("kicks off challenge and returns ok: true", async () => {
      vi.mocked(adminChallengeRepo.kickoffChallenge).mockResolvedValueOnce({
        status: "ACTIVE",
      } as any);

      const result = await kickoffChallengeAction("chal-1");
      expect(result).toEqual({ ok: true, status: "ACTIVE" });
      expect(adminChallengeRepo.kickoffChallenge).toHaveBeenCalledWith("chal-1", {
        id: "admin-1",
        username: "host_alex",
      });
    });
  });

  describe("finalizeChallengeAction", () => {
    it("finalizes challenge and returns ok: true", async () => {
      vi.mocked(adminChallengeRepo.finalizeChallenge).mockResolvedValueOnce({
        status: "COMPLETED",
      } as any);

      const result = await finalizeChallengeAction("chal-1");
      expect(result).toEqual({ ok: true, status: "COMPLETED" });
      expect(adminChallengeRepo.finalizeChallenge).toHaveBeenCalledWith("chal-1", {
        id: "admin-1",
        username: "host_alex",
      });
    });
  });

  describe("enrollParticipantAction", () => {
    it("parses target duration and enrolls participant", async () => {
      vi.mocked(adminChallengeRepo.enrollParticipant).mockResolvedValueOnce({
        id: "part-1",
      } as any);

      const result = await enrollParticipantAction({
        challengeId: "chal-1",
        userId: "u-1",
        teamId: "t-1",
        targetClock: "25:00:00",
      });

      expect(result).toEqual({ ok: true, participantId: "part-1" });
      expect(adminChallengeRepo.enrollParticipant).toHaveBeenCalledWith(
        {
          challengeId: "chal-1",
          userId: "u-1",
          teamId: "t-1",
          targetSeconds: 90000,
        },
        { id: "admin-1", username: "host_alex" },
      );
    });

    it("rejects invalid target clock string", async () => {
      const result = await enrollParticipantAction({
        challengeId: "chal-1",
        userId: "u-1",
        teamId: "t-1",
        targetClock: "not-a-clock",
      });

      expect(result.ok).toBe(false);
      expect(adminChallengeRepo.enrollParticipant).not.toHaveBeenCalled();
    });
  });

  describe("renameDuoTeamAction", () => {
    it("renames duo team successfully", async () => {
      vi.mocked(adminChallengeRepo.renameDuoTeam).mockResolvedValueOnce({
        name: "Caffeine & Code",
      } as any);

      const result = await renameDuoTeamAction({
        challengeId: "chal-1",
        teamId: "t-1",
        newName: "Caffeine & Code",
        reason: "Partner request",
      });

      expect(result).toEqual({ ok: true, teamName: "Caffeine & Code" });
    });
  });
});

