import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  calculateRemainingDeficit,
  calculateRequiredDailyPace,
} from "@/features/leaderboard/domain/deficit";
import {
  buildCatchUpSummary,
} from "@/features/leaderboard/domain/catch-up-presentation";
import {
  aggregateTeamScores,
  calculateLeadMargin,
} from "@/features/leaderboard/domain/leaderboard";
import { rankParticipants } from "@/features/leaderboard/domain/standings";
import { logStudyTimeAction } from "@/features/study-logs/api/log-study-time.action";
import { toggleWeeklyGoalAction } from "@/features/declarations/api/declaration.actions";
import * as requireSessionModule from "@/features/auth/api/require-session";
import * as requireParticipantModule from "@/features/auth/api/require-participant";
import * as dailyStudyLogRepo from "@/features/study-logs/data/daily-study-log.repository";
import * as weeklyGoalRepo from "@/features/declarations/data/weekly-goal.repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/api/require-session", () => ({
  AuthError: class AuthError extends Error {},
  requireSessionUser: vi.fn(),
}));

vi.mock("@/features/auth/api/require-participant", () => ({
  ParticipantAccessError: class ParticipantAccessError extends Error {
    readonly code = "NOT_ENROLLED";
  },
  requireOwnedParticipant: vi.fn(),
}));

vi.mock("@/features/study-logs/data/daily-study-log.repository", () => ({
  upsertDailyStudyLog: vi.fn(),
}));

vi.mock("@/features/declarations/data/weekly-goal.repository", () => ({
  setWeeklyGoalCompleted: vi.fn(),
}));

describe("Journey J4: Daily Study Logging & Dynamic Catch-Up Recalculation (Law L2 & Law L3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("J4.1: Daily Study Logging & Challenge Lifecycle Gating", () => {
    it("successfully logs study duration when challenge is ACTIVE", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
        id: "usr_1",
      } as any);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValueOnce({
        id: "part_1",
        challenge: { status: "ACTIVE" },
      } as any);

      vi.mocked(dailyStudyLogRepo.upsertDailyStudyLog).mockResolvedValueOnce({
        id: "log-1",
      } as any);

      const result = await logStudyTimeAction({
        challengeId: "chal_1",
        logDate: "2026-09-02",
        hours: 4,
        minutes: 30,
        seconds: 0,
      });

      expect(result.ok).toBe(true);
      expect(dailyStudyLogRepo.upsertDailyStudyLog).toHaveBeenCalledWith({
        participantId: "part_1",
        logDate: "2026-09-02",
        durationSeconds: 16200, // 04:30:00
      });
    });

    it("rejects study logs when challenge is not ACTIVE (e.g. UPCOMING)", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
        id: "usr_1",
      } as any);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValueOnce({
        id: "part_1",
        challenge: { status: "UPCOMING" },
      } as any);

      const resultUpcoming = await logStudyTimeAction({
        challengeId: "chal_1",
        logDate: "2026-09-02",
        hours: 2,
        minutes: 0,
        seconds: 0,
      });

      expect(resultUpcoming.ok).toBe(false);
      if (!resultUpcoming.ok) {
        expect(resultUpcoming.code).toBe("CHALLENGE_NOT_ACTIVE");
        expect(resultUpcoming.message).toMatch(/active challenges/i);
      }
    });

    it("rejects study logs exceeding 86,400 seconds (24 hours)", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
        id: "usr_1",
      } as any);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValueOnce({
        id: "part_1",
        challenge: { status: "ACTIVE" },
      } as any);

      const resultExceeded = await logStudyTimeAction({
        challengeId: "chal_1",
        logDate: "2026-09-02",
        hours: 24,
        minutes: 1, // 24h 01m = 86460s > 86400s
        seconds: 0,
      });

      expect(resultExceeded.ok).toBe(false);
      if (!resultExceeded.ok) {
        expect(resultExceeded.code).toBe("DAILY_LIMIT_EXCEEDED");
        expect(resultExceeded.message).toMatch(/cannot exceed 24:00:00/i);
      }
    });

    it("allows participant to toggle their weekly goal completion during active challenge", async () => {
      vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
        id: "usr_1",
      } as any);

      vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValueOnce({
        id: "part_1",
        challenge: { status: "ACTIVE" },
      } as any);

      vi.mocked(weeklyGoalRepo.setWeeklyGoalCompleted).mockResolvedValueOnce({
        id: "goal-1",
        completed: true,
      } as any);

      const result = await toggleWeeklyGoalAction({
        challengeId: "chal_1",
        goalId: "goal-1",
        completed: true,
      });

      expect(result.ok).toBe(true);
      expect(weeklyGoalRepo.setWeeklyGoalCompleted).toHaveBeenCalledWith(
        "part_1",
        "goal-1",
        true,
      );
    });
  });

  describe("J4.2: The Catch-Up Deficit Model (Law L3: Zero Grace Passes)", () => {
    it("dynamically calculates remaining deficit and required daily pace without grace passes", () => {
      const targetSeconds = 35 * 3600; // 35 hours = 126,000s
      const loggedSeconds = 10 * 3600; // 10 hours = 36,000s
      const daysRemaining = 5;

      const deficit = calculateRemainingDeficit(targetSeconds, loggedSeconds);
      expect(deficit).toBe(25 * 3600); // 25 hours = 90,000s

      const dailyPace = calculateRequiredDailyPace(deficit, daysRemaining);
      expect(dailyPace).toBe(5 * 3600); // 5 hours/day = 18,000s/day

      const summary = buildCatchUpSummary({
        targetSeconds,
        totalLoggedSeconds: loggedSeconds,
        daysRemaining,
      });

      expect(summary.tone).toBe("catch-up");
      expect(summary.deficitSeconds).toBe(90000);
      expect(summary.paceSecondsPerDay).toBe(18000);
      expect(summary.message).toContain("5h/day over the next 5 days");
      expect(summary.message).toContain("Deficits roll forward seamlessly");
    });

    it("rewards exceeding or meeting target with serene completion status (deficit = 0)", () => {
      const targetSeconds = 30 * 3600;
      const loggedSeconds = 35 * 3600; // exceeded by 5 hours

      const deficit = calculateRemainingDeficit(targetSeconds, loggedSeconds);
      expect(deficit).toBe(0);

      const summary = buildCatchUpSummary({
        targetSeconds,
        totalLoggedSeconds: loggedSeconds,
        daysRemaining: 2,
      });

      expect(summary.tone).toBe("complete");
      expect(summary.deficitSeconds).toBe(0);
      expect(summary.message).toContain("On serene pace");
    });
  });

  describe("J4.3: Scoreboard & Standings Re-aggregation (Law L1 & Law L2)", () => {
    it("aggregates team scores and calculates lead margin automatically", () => {
      const teams = [{ id: "team-bees" }, { id: "team-butterflies" }];
      const logs = [
        { teamId: "team-bees", loggedSeconds: 36000 },
        { teamId: "team-bees", loggedSeconds: 18000 },
        { teamId: "team-butterflies", loggedSeconds: 72000 },
      ];

      const aggregates = aggregateTeamScores(teams, logs);
      expect(aggregates[0].teamId).toBe("team-butterflies");
      expect(aggregates[0].totalSeconds).toBe(72000);
      expect(aggregates[1].teamId).toBe("team-bees");
      expect(aggregates[1].totalSeconds).toBe(54000);

      const lead = calculateLeadMargin(72000, 54000);
      expect(lead.leader).toBe("a");
      expect(lead.marginSeconds).toBe(18000);
    });

    it("ranks participants deterministically with tie-breaker rules", () => {
      const participants = [
        {
          id: "p1",
          totalLoggedSeconds: 36000,
          targetSeconds: 72000,
          enrolledAt: new Date("2026-09-01"),
          completedGoalsCount: 2,
          totalGoalsCount: 2,
        },
        {
          id: "p2",
          totalLoggedSeconds: 54000,
          targetSeconds: 72000,
          enrolledAt: new Date("2026-09-01"),
          completedGoalsCount: 1,
          totalGoalsCount: 2,
        },
      ];

      const ranked = rankParticipants(participants);
      expect(ranked[0].item.id).toBe("p2");
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].item.id).toBe("p1");
      expect(ranked[1].rank).toBe(2);
    });
  });
});
