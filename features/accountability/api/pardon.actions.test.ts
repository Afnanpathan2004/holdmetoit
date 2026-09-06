import { beforeEach, describe, expect, it, vi } from "vitest";

import { pardonParticipantAction, revokePardonAction } from "./pardon.actions";
import * as requireAdminModule from "@/features/auth/api/require-admin";
import * as pardonRepo from "@/features/accountability/data/pardon.repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/api/require-admin", () => ({
  requireAdminOrHost: vi.fn(),
  AdminAccessError: class AdminAccessError extends Error {},
}));

vi.mock("@/features/accountability/data/pardon.repository", () => ({
  adminPardonParticipant: vi.fn(),
  adminRevokePardon: vi.fn(),
}));

describe("pardon.actions", () => {
  const mockAdmin = { id: "admin-1", username: "host_alex", role: "ADMIN" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminModule.requireAdminOrHost).mockResolvedValue(mockAdmin as any);
  });

  describe("pardonParticipantAction", () => {
    it("pardons participant with valid reason", async () => {
      vi.mocked(pardonRepo.adminPardonParticipant).mockResolvedValueOnce({
        id: "pun-1",
      } as any);

      const result = await pardonParticipantAction({
        challengeId: "chal-1",
        participantId: "part-1",
        reason: "Hospitalization verified",
      });

      expect(result).toEqual({ ok: true, punishmentId: "pun-1" });
      expect(pardonRepo.adminPardonParticipant).toHaveBeenCalledWith({
        challengeId: "chal-1",
        participantId: "part-1",
        reason: "Hospitalization verified",
        actor: { id: "admin-1", username: "host_alex" },
      });
    });

    it("rejects pardon when reason is missing", async () => {
      const result = await pardonParticipantAction({
        challengeId: "chal-1",
        participantId: "part-1",
        reason: "  ",
      });

      expect(result.ok).toBe(false);
      expect(pardonRepo.adminPardonParticipant).not.toHaveBeenCalled();
    });
  });

  describe("revokePardonAction", () => {
    it("revokes pardon with reason", async () => {
      vi.mocked(pardonRepo.adminRevokePardon).mockResolvedValueOnce({
        id: "pun-1",
      } as any);

      const result = await revokePardonAction({
        challengeId: "chal-1",
        participantId: "part-1",
        reason: "Issued by mistake",
      });

      expect(result).toEqual({ ok: true, punishmentId: "pun-1" });
      expect(pardonRepo.adminRevokePardon).toHaveBeenCalledWith({
        challengeId: "chal-1",
        participantId: "part-1",
        reason: "Issued by mistake",
        actor: { id: "admin-1", username: "host_alex" },
      });
    });
  });
});

