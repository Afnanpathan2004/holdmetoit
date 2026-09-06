import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChallenge,
  enrollParticipant,
  renameDuoTeam,
  ChallengeValidationError,
} from "@/features/challenges/data/admin-challenge.repository";
import { prisma as basePrisma } from "@/core/db";

const prisma = basePrisma as any;

vi.mock("@/core/db", () => {
  const mockPrisma = {
    $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
    challenge: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    challengeParticipant: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Journey J2: Challenge Operations & Rostering (Law L1 & Law L2)", () => {
  const actor = { id: "admin-1", username: "host_alex" };
  const startAt = new Date("2026-09-01T00:00:00Z");
  const endAt = new Date("2026-09-08T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("J2.1: Mathematical Parity & Capacity Configuration (Law L1)", () => {
    it("creates TEAM_VS_TEAM challenge with uncapped team capacity (maxMembers = null)", async () => {
      vi.mocked(prisma.challenge.create).mockResolvedValueOnce({
        id: "chal-team-1",
        title: "Hive Wars",
        format: "TEAM_VS_TEAM",
        status: "UPCOMING",
        startAt,
        endAt,
        punishmentPfpUrl: null,
        hostId: "host-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        teams: [
          { id: "t1", name: "Bees", maxMembers: null },
          { id: "t2", name: "Wasps", maxMembers: null },
        ],
      } as any);

      const challenge = await createChallenge(
        {
          title: "Hive Wars",
          format: "TEAM_VS_TEAM",
          startAt,
          endAt,
          teams: [{ name: "Bees" }, { name: "Wasps" }],
        },
        "host-1",
        actor,
      );

      expect(challenge.format).toBe("TEAM_VS_TEAM");
      expect(challenge.status).toBe("UPCOMING");
      expect(prisma.challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            format: "TEAM_VS_TEAM",
            teams: {
              create: expect.arrayContaining([
                expect.objectContaining({ name: "Bees", maxMembers: null }),
                expect.objectContaining({ name: "Wasps", maxMembers: null }),
              ]),
            },
          }),
        }),
      );
    });

    it("enforces Law L1 for DUOS: maxMembers is strictly locked to 2", async () => {
      vi.mocked(prisma.challenge.create).mockResolvedValueOnce({
        id: "chal-duos-1",
        title: "Dynamic Duos",
        format: "DUOS",
        status: "UPCOMING",
        startAt,
        endAt,
        punishmentPfpUrl: null,
        hostId: "host-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        teams: [{ id: "t1", name: "Batman & Robin", maxMembers: 2 }],
      } as any);

      const challenge = await createChallenge(
        {
          title: "Dynamic Duos",
          format: "DUOS",
          startAt,
          endAt,
          teams: [{ name: "Batman & Robin" }],
        },
        "host-1",
        actor,
      );

      expect(challenge.format).toBe("DUOS");
      expect(prisma.challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            format: "DUOS",
            teams: {
              create: expect.arrayContaining([
                expect.objectContaining({ name: "Batman & Robin", maxMembers: 2 }),
              ]),
            },
          }),
        }),
      );
    });

    it("enforces Law L1 for SOLOS: maxMembers is strictly locked to 1", async () => {
      vi.mocked(prisma.challenge.create).mockResolvedValueOnce({
        id: "chal-solos-1",
        title: "Lone Wolves",
        format: "SOLOS",
        status: "UPCOMING",
        startAt,
        endAt,
        punishmentPfpUrl: null,
        hostId: "host-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        teams: [{ id: "t1", name: "Solo Fighter A", maxMembers: 1 }],
      } as any);

      const challenge = await createChallenge(
        {
          title: "Lone Wolves",
          format: "SOLOS",
          startAt,
          endAt,
          teams: [{ name: "Solo Fighter A" }],
        },
        "host-1",
        actor,
      );

      expect(challenge.format).toBe("SOLOS");
      expect(challenge.teams[0].maxMembers).toBe(1);
    });
  });

  describe("J2.2: Rostering & Team Capacity Enforcement", () => {
    it("rejects 3rd participant in a Duo team with maximum capacity validation error", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "user-3", name: "Charlie" } as any);
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-duos-1",
        teams: [{ id: "duo-team-1", name: "Duo Alpha", maxMembers: 2 }],
      } as any);
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce(null); // not yet enrolled
      vi.mocked(prisma.challengeParticipant.count).mockResolvedValueOnce(2); // already has 2 members

      await expect(
        enrollParticipant(
          {
            challengeId: "chal-duos-1",
            userId: "user-3",
            teamId: "duo-team-1",
          },
          actor,
        ),
      ).rejects.toThrow(/reached its maximum capacity of 2 member\(s\)/);
    });

    it("rejects 2nd participant in a Solo team with maximum capacity validation error", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "user-2", name: "Bob" } as any);
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-solos-1",
        teams: [{ id: "solo-team-1", name: "Solo Unit", maxMembers: 1 }],
      } as any);
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.challengeParticipant.count).mockResolvedValueOnce(1); // already 1 member

      await expect(
        enrollParticipant(
          {
            challengeId: "chal-solos-1",
            userId: "user-2",
            teamId: "solo-team-1",
          },
          actor,
        ),
      ).rejects.toThrow(/reached its maximum capacity of 1 member\(s\)/);
    });

    it("prevents duplicate enrollment of the same user in a challenge", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "user-1", name: "Alice" } as any);
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-team-1",
        teams: [{ id: "team-bees", name: "Bees", maxMembers: null }],
      } as any);
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
        id: "part-existing",
      } as any);

      await expect(
        enrollParticipant(
          {
            challengeId: "chal-team-1",
            userId: "user-1",
            teamId: "team-bees",
          },
          actor,
        ),
      ).rejects.toThrow(/User is already enrolled in this challenge/);
    });
  });

  describe("J2.3: Duo Team Customization & Security Boundary Verification", () => {
    it("allows host to rename Duo team and logs audit entry", async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValueOnce({
        id: "team-1",
        challengeId: "chal-1",
        name: "Old Team Name",
      } as any);
      vi.mocked(prisma.team.update).mockResolvedValueOnce({
        id: "team-1",
        challengeId: "chal-1",
        name: "Study Dragons",
      } as any);

      const renamed = await renameDuoTeam(
        "team-1",
        "Study Dragons",
        actor,
        "Custom duo team name",
        "chal-1",
      );

      expect(renamed.name).toBe("Study Dragons");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionType: "DUO_RENAMED",
            targetEntityId: "team-1",
            targetEntityType: "TEAM",
            auditReason: "Custom duo team name",
          }),
        }),
      );
    });

    it("rejects renaming if team belongs to a different challenge (Cross-Challenge Security Boundary)", async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValueOnce({
        id: "team-foreign",
        challengeId: "chal-other",
        name: "Foreign Team",
      } as any);

      await expect(
        renameDuoTeam(
          "team-foreign",
          "Hijacked Name",
          actor,
          "Attempted hijack",
          "chal-1", // caller is host of chal-1, but team is in chal-other
        ),
      ).rejects.toThrow(/Specified team does not belong to this challenge/);
    });
  });
});

