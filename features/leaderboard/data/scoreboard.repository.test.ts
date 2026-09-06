import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildScoreboardViewModel,
  getScoreboardData,
  RawChallengePayload,
} from "./scoreboard.repository";
import { prisma } from "@/core/db";

vi.mock("@/core/db", () => ({
  prisma: {
    challenge: {
      findUnique: vi.fn(),
    },
  },
}));

describe("scoreboard.repository", () => {
  const baseDate = new Date("2026-09-01T00:00:00Z");
  const endDate = new Date("2026-09-08T00:00:00Z");

  const sampleChallenge: RawChallengePayload = {
    id: "chal-1",
    title: "Battle of the Houses",
    format: "TEAM_VS_TEAM",
    status: "ACTIVE",
    startAt: baseDate,
    endAt: endDate,
    punishmentPfpUrl: "https://cdn.holdmeto.it/pfp/clown-bee.jpg",
    teams: [
      {
        id: "team-bees",
        name: "Honey Bees",
        color: "#ebb06e",
        iconEmoji: "🐝",
        mascotUrl: null,
        sortOrder: 0,
      },
      {
        id: "team-butterflies",
        name: "Lavender Butterflies",
        color: "#9986b8",
        iconEmoji: "🦋",
        mascotUrl: null,
        sortOrder: 1,
      },
    ],
    participants: [
      {
        id: "part-1",
        userId: "user-1",
        teamId: "team-bees",
        targetSeconds: 36000,
        enrolledAt: new Date("2026-09-01T01:00:00Z"),
        user: {
          id: "user-1",
          name: "Alice",
          username: "alice_bee",
          displayName: "Alice B",
          image: "https://cdn.holdmeto.it/avatars/alice.png",
        },
        dailyStudyLogs: [{ durationSeconds: 18000 }, { durationSeconds: 7200 }], // 25200s
        weeklyGoals: [
          { id: "g-1", description: "Read Chapter 1", completed: true },
          { id: "g-2", description: "Solve Problem Set 1", completed: false },
        ],
        punishmentRecord: null,
      },
      {
        id: "part-2",
        userId: "user-2",
        teamId: "team-butterflies",
        targetSeconds: 36000,
        enrolledAt: new Date("2026-09-01T02:00:00Z"),
        user: {
          id: "user-2",
          name: "Bob",
          username: "bob_flutter",
          displayName: "Bob F",
          image: null,
        },
        dailyStudyLogs: [{ durationSeconds: 14400 }], // 14400s
        weeklyGoals: [
          { id: "g-3", description: "Write Essay", completed: true },
        ],
        punishmentRecord: null,
      },
    ],
  };

  describe("buildScoreboardViewModel", () => {
    it("aggregates team totals and determines leader with lead margin", () => {
      const vm = buildScoreboardViewModel(sampleChallenge, new Date("2026-09-03T00:00:00Z"));

      expect(vm.teams).toHaveLength(2);
      const bees = vm.teams.find((t) => t.id === "team-bees")!;
      const butterflies = vm.teams.find((t) => t.id === "team-butterflies")!;

      expect(bees.totalSeconds).toBe(25200);
      expect(bees.memberCount).toBe(1);
      expect(butterflies.totalSeconds).toBe(14400);
      expect(butterflies.memberCount).toBe(1);

      expect(vm.leadMargin).not.toBeNull();
      expect(vm.leadMargin?.leader).toBe("a");
      expect(vm.leadMargin?.marginSeconds).toBe(10800); // 25200 - 14400 = 10800
      expect(vm.leadMargin?.isTie).toBe(false);
      expect(vm.leadMargin?.leadingTeam?.id).toBe("team-bees");
      expect(vm.leadMargin?.trailingTeam?.id).toBe("team-butterflies");
    });

    it("handles tie match cleanly with isTie = true and leader = tie", () => {
      const tiedChallenge: RawChallengePayload = {
        ...sampleChallenge,
        participants: [
          {
            ...sampleChallenge.participants[0],
            dailyStudyLogs: [{ durationSeconds: 10000 }],
          },
          {
            ...sampleChallenge.participants[1],
            dailyStudyLogs: [{ durationSeconds: 10000 }],
          },
        ],
      };

      const vm = buildScoreboardViewModel(tiedChallenge);
      expect(vm.leadMargin?.isTie).toBe(true);
      expect(vm.leadMargin?.leader).toBe("tie");
      expect(vm.leadMargin?.marginSeconds).toBe(0);
      expect(vm.leadMargin?.leadingTeam).toBeNull();
      expect(vm.leadMargin?.trailingTeam).toBeNull();
    });

    it("ranks participants with podium styling indicators", () => {
      const vm = buildScoreboardViewModel(sampleChallenge);
      expect(vm.participants).toHaveLength(2);
      expect(vm.participants[0].id).toBe("part-1");
      expect(vm.participants[0].rank).toBe(1);
      expect(vm.participants[0].isPodium).toBe(1);
      expect(vm.participants[0].displayName).toBe("Alice B");

      expect(vm.participants[1].id).toBe("part-2");
      expect(vm.participants[1].rank).toBe(2);
      expect(vm.participants[1].isPodium).toBe(2);
      expect(vm.participants[1].displayName).toBe("Bob F");
    });

    it("returns empty punishedParticipants during ACTIVE and UPCOMING status", () => {
      const activeVm = buildScoreboardViewModel({
        ...sampleChallenge,
        status: "ACTIVE",
      });
      expect(activeVm.punishedParticipants).toHaveLength(0);

      const upcomingVm = buildScoreboardViewModel({
        ...sampleChallenge,
        status: "UPCOMING",
      });
      expect(upcomingVm.punishedParticipants).toHaveLength(0);
    });

    it("evaluates dual-failure accountability and populates punishedParticipants on COMPLETED status", () => {
      const completedChallenge: RawChallengePayload = {
        ...sampleChallenge,
        status: "COMPLETED",
        participants: [
          // part-1: logged 25200 < 36000 target AND has 1 incomplete goal -> punished
          sampleChallenge.participants[0],
          // part-2: logged 36000 = 36000 target AND all goals complete -> NOT punished
          {
            ...sampleChallenge.participants[1],
            dailyStudyLogs: [{ durationSeconds: 36000 }],
            weeklyGoals: [{ id: "g-3", description: "Done", completed: true }],
          },
          // part-3: hours met, but incomplete goal -> punished
          {
            id: "part-3",
            userId: "user-3",
            teamId: "team-bees",
            targetSeconds: 10000,
            enrolledAt: new Date("2026-09-01T03:00:00Z"),
            dailyStudyLogs: [{ durationSeconds: 12000 }],
            weeklyGoals: [{ id: "g-4", description: "Unfinished", completed: false }],
          },
          // part-4: punished by rule, but pardoned in DB -> excluded from punishedParticipants
          {
            id: "part-4",
            userId: "user-4",
            teamId: "team-butterflies",
            targetSeconds: 20000,
            enrolledAt: new Date("2026-09-01T04:00:00Z"),
            dailyStudyLogs: [{ durationSeconds: 5000 }],
            weeklyGoals: [{ id: "g-5", description: "Sick", completed: false }],
            punishmentRecord: {
              id: "pun-4",
              isPunished: true,
              isPardoned: true,
              pardonReason: "Flu outbreak verified by host",
            },
          },
        ],
      };

      const vm = buildScoreboardViewModel(completedChallenge);
      expect(vm.punishedParticipants).toHaveLength(2);
      expect(vm.punishedParticipants.map((p) => p.id)).toEqual(["part-1", "part-3"]);

      // Verify pardoned participant status badge
      const pardoned = vm.participants.find((p) => p.id === "part-4")!;
      expect(pardoned.statusBadge.label).toBe("Pardoned");
      expect(pardoned.statusBadge.variant).toBe("neutral");

      // Verify successful participant status badge
      const completed = vm.participants.find((p) => p.id === "part-2")!;
      expect(completed.statusBadge.label).toBe("Completed");
      expect(completed.statusBadge.variant).toBe("sage");

      // Verify forfeit participant status badge
      const forfeit = vm.participants.find((p) => p.id === "part-1")!;
      expect(forfeit.statusBadge.label).toBe("Forfeit");
      expect(forfeit.statusBadge.variant).toBe("terracotta");
    });
  });

  describe("getScoreboardData", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns null when prisma.challenge.findUnique returns null", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce(null);

      const result = await getScoreboardData("non-existent-id");
      expect(result).toBeNull();
      expect(prisma.challenge.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent-id" },
        include: expect.any(Object),
      });
    });

    it("queries database and returns formatted ScoreboardViewModel", async () => {
      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        ...sampleChallenge,
        createdAt: new Date(),
        updatedAt: new Date(),
        hostId: "host-1",
        participants: sampleChallenge.participants.map((p) => ({
          ...p,
          challengeId: sampleChallenge.id,
          status: "NORMAL",
          updatedAt: new Date(),
          user: p.user ? { ...p.user, email: null, emailVerified: null, role: "PARTICIPANT", createdAt: new Date(), updatedAt: new Date(), discordId: null } : null,
          team: sampleChallenge.teams.find((t) => t.id === p.teamId)!,
          dailyStudyLogs: (p.dailyStudyLogs ?? []).map((l, i) => ({
            id: `log-${i}`,
            participantId: p.id,
            logDate: new Date(),
            durationSeconds: l.durationSeconds,
            isOverride: false,
            overrideById: null,
            overrideReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          weeklyGoals: (p.weeklyGoals ?? []).map((g, i) => ({
            id: g.id,
            participantId: p.id,
            description: g.description,
            completed: g.completed,
            sortOrder: i,
            completedAt: g.completed ? new Date() : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          punishmentRecord: null,
        })),
        teams: sampleChallenge.teams.map((t) => ({
          ...t,
          challengeId: sampleChallenge.id,
          maxMembers: null,
        })),
      } as any);

      const result = await getScoreboardData("chal-1");
      expect(result).not.toBeNull();
      expect(result?.challenge.title).toBe("Battle of the Houses");
      expect(result?.teams).toHaveLength(2);
      expect(result?.participants).toHaveLength(2);
    });
  });
});

