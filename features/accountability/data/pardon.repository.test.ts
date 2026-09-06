import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  adminPardonParticipant,
  adminRevokePardon,
} from "./pardon.repository";
import { prisma } from "@/core/db";

vi.mock("@/core/db", () => {
  const mockPrisma = {
    $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
    challengeParticipant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    punishmentRecord: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("pardon.repository", () => {
  const actor = { id: "admin-1", username: "host_alex" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pardons participant, updates status to EXCUSED, and writes audit log", async () => {
    vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
      id: "part-1",
      challengeId: "chal-1",
      status: "PUNISHED",
      punishmentRecord: {
        id: "pun-1",
        isPunished: true,
        isPardoned: false,
      },
    } as any);

    vi.mocked(prisma.punishmentRecord.upsert).mockResolvedValueOnce({
      id: "pun-1",
      isPardoned: true,
      pardonReason: "Medical emergency verified",
    } as any);

    const result = await adminPardonParticipant({
      participantId: "part-1",
      reason: "Medical emergency verified",
      actor,
    });

    expect(result.isPardoned).toBe(true);

    expect(prisma.challengeParticipant.update).toHaveBeenCalledWith({
      where: { id: "part-1" },
      data: { status: "EXCUSED" },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: "PARTICIPANT_PARDONED",
        targetEntityId: "part-1",
        auditReason: "Medical emergency verified",
      }),
    });
  });

  it("rejects pardon if reason is empty", async () => {
    await expect(
      adminPardonParticipant({
        participantId: "part-1",
        reason: "   ",
        actor,
      }),
    ).rejects.toThrow("Audit reason is required to pardon a participant.");
  });

  it("revokes pardon, resets status to PUNISHED, and writes audit log", async () => {
    vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
      id: "part-1",
      status: "EXCUSED",
      punishmentRecord: {
        id: "pun-1",
        isPardoned: true,
      },
    } as any);

    vi.mocked(prisma.punishmentRecord.update).mockResolvedValueOnce({
      id: "pun-1",
      isPardoned: false,
    } as any);

    const result = await adminRevokePardon({
      participantId: "part-1",
      reason: "Mistaken pardon reversal",
      actor,
    });

    expect(result.isPardoned).toBe(false);

    expect(prisma.challengeParticipant.update).toHaveBeenCalledWith({
      where: { id: "part-1" },
      data: { status: "PUNISHED" },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: "PARDON_REVOKED",
        targetEntityId: "part-1",
      }),
    });
  });
});

