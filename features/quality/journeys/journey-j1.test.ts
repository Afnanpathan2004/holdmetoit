import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapDiscordProfileToUserFields } from "@/features/auth/data/discord-profile.mapper";
import {
  AdminAccessError,
  requireAdminOrHost,
} from "@/features/auth/api/require-admin";
import { AuthError } from "@/features/auth/api/require-session";
import { getScoreboardData } from "@/features/leaderboard/data/scoreboard.repository";
import { logStudyTimeAction } from "@/features/study-logs/api/log-study-time.action";
import { createChallengeAction } from "@/features/challenges/api/challenge-admin.actions";
import { auth } from "@/core/auth";
import { prisma } from "@/core/db";

vi.mock("@/core/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/core/db", () => {
  const mockPrisma = {
    $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
    challenge: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    challengeParticipant: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
    },
    dailyStudyLog: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Journey J1: Auth & Public Spectator (Law L4 & Law L9)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("J1.1: Public Spectator Access (No Auth Required)", () => {
    it("allows unauthenticated guests to view public challenge scoreboard and standings", async () => {
      const mockChallenge = {
        id: "chal-public-1",
        title: "Spring Finals Sprint",
        format: "TEAM_VS_TEAM",
        status: "ACTIVE",
        startAt: new Date("2026-05-01"),
        endAt: new Date("2026-05-08"),
        punishmentPfpUrl: "https://cdn.discordapp.com/icons/avatar.png",
        teams: [
          {
            id: "team-bees",
            name: "Bees",
            color: "#fbbf24",
            iconEmoji: "🐝",
            mascotUrl: null,
            sortOrder: 0,
          },
        ],
        participants: [
          {
            id: "part-1",
            userId: "user-1",
            teamId: "team-bees",
            targetSeconds: 72000,
            status: "ACTIVE",
            enrolledAt: new Date("2026-05-01"),
            user: { id: "user-1", name: "Buzz", displayName: "Buzz Light", image: null },
            dailyStudyLogs: [{ durationSeconds: 36000 }],
            weeklyGoals: [{ id: "g1", description: "Read Chapter 1", completed: true, sortOrder: 0 }],
          },
        ],
      };

      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce(mockChallenge as any);

      const scoreboardData = await getScoreboardData("chal-public-1");

      expect(scoreboardData).not.toBeNull();
      expect(scoreboardData?.challenge.title).toBe("Spring Finals Sprint");
      expect(scoreboardData?.challenge.status).toBe("ACTIVE");
      expect(scoreboardData?.teams).toHaveLength(1);
      expect(scoreboardData?.teams[0].name).toBe("Bees");
      expect(scoreboardData?.teams[0].totalSeconds).toBe(36000);
      expect(scoreboardData?.participants[0].rank).toBe(1);
    });

    it("returns null gracefully when challenge is not found without throwing unhandled exceptions (Law L9)", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce(null);

      const scoreboardData = await getScoreboardData("nonexistent-challenge");
      expect(scoreboardData).toBeNull();
    });
  });

  describe("J1.2: Discord OAuth Profile Provisioning & Normalization", () => {
    it("maps Discord profile payload into database User structure according to Law L4", () => {
      const discordProfile = {
        providerAccountId: "123456789012345678",
        username: "studious_bee",
        globalName: "Studious Bee 🐝",
        image: "https://cdn.discordapp.com/avatars/123456789012345678/a_123456789abcdef.png",
      };

      const mapped = mapDiscordProfileToUserFields(discordProfile);

      expect(mapped.discordId).toBe("123456789012345678");
      expect(mapped.username).toBe("studious_bee");
      expect(mapped.displayName).toBe("Studious Bee 🐝");
      expect(mapped.image).toBe(
        "https://cdn.discordapp.com/avatars/123456789012345678/a_123456789abcdef.png",
      );
    });

    it("falls back to username when globalName is missing and preserves null image", () => {
      const discordProfile = {
        providerAccountId: "987654321098765432",
        username: "solitary_owl",
        globalName: null,
        image: null,
      };

      const mapped = mapDiscordProfileToUserFields(discordProfile);

      expect(mapped.displayName).toBe("solitary_owl");
      expect(mapped.image).toBeNull();
    });
  });

  describe("J1.3: Authentication & Authorization Security Gates", () => {
    it("rejects unauthenticated user mutations in logStudyTimeAction", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const result = await logStudyTimeAction({
        challengeId: "chal-1",
        logDate: "2026-05-02",
        hours: 2,
        minutes: 30,
        seconds: 0,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("UNAUTHORIZED");
        expect(result.message).toMatch(/sign in/i);
      }
    });

    it("rejects unauthenticated user mutations in createChallengeAction with AuthError", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      await expect(
        createChallengeAction({
          title: "Unauthorized Challenge",
          format: "SOLOS",
          startAt: "2026-06-01T00:00:00Z",
          endAt: "2026-06-08T00:00:00Z",
          teams: [{ name: "Solo A" }],
        }),
      ).rejects.toThrow(AuthError);
    });

    it("rejects non-admin, non-host user from host-gated actions with AdminAccessError", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "regular-user", role: "USER" },
      } as any);

      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        hostId: "other-host",
      } as any);

      await expect(requireAdminOrHost("chal-1")).rejects.toThrow(AdminAccessError);
    });

    it("permits global ADMIN user even if not challenge creator", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "global-admin", role: "ADMIN" },
      } as any);

      const user = await requireAdminOrHost("chal-1");
      expect(user.id).toBe("global-admin");
      expect(user.role).toBe("ADMIN");
    });

    it("permits host user on their own created challenge", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "host-user", role: "USER" },
      } as any);

      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        hostId: "host-user",
      } as any);

      const user = await requireAdminOrHost("chal-1");
      expect(user.id).toBe("host-user");
    });
  });
});
