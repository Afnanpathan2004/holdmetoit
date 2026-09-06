import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminOverrideDailyStudyLog } from "@/features/study-logs/data/daily-study-log.repository";
import {
  adminAddGoal,
  adminEditGoal,
  adminToggleGoalCompletion,
} from "@/features/declarations/data/weekly-goal.repository";
import { overrideStudyHoursAction } from "@/features/study-logs/api/study-log-override.action";
import {
  adminAddGoalAction,
  adminEditGoalAction,
  adminToggleGoalAction,
} from "@/features/declarations/api/admin-goal.actions";
import { AdminAccessError } from "@/features/auth/api/require-admin";
import { auth } from "@/core/auth";
import { prisma as basePrisma } from "@/core/db";

const prisma = basePrisma as any;

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
    },
    challengeParticipant: {
      findUnique: vi.fn(),
    },
    dailyStudyLog: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    weeklyGoal: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Journey J5: Host Manual Override & Audit Logging (Law L5)", () => {
  const actor = { id: "host-1", username: "host_alex" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("J5.1: Admin Inline Hours Override & Audit Trail (Law L5)", () => {
    it("successfully overrides daily hours, flags isOverride = true, and records audit trail", async () => {
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
        id: "part-1",
        challengeId: "chal-1",
      } as any);

      vi.mocked(prisma.dailyStudyLog.findUnique).mockResolvedValueOnce({
        id: "log-1",
        durationSeconds: 0,
        isOverride: false,
      } as any);

      vi.mocked(prisma.dailyStudyLog.upsert).mockResolvedValueOnce({
        id: "log-1",
        participantId: "part-1",
        durationSeconds: 13500, // 03:45:00
        isOverride: true,
        overrideBy: actor.id,
      } as any);

      const updated = await adminOverrideDailyStudyLog({
        challengeId: "chal-1",
        participantId: "part-1",
        logDate: "2026-09-02",
        durationSeconds: 13500,
        reason: "Timer app crashed; participant provided verified YPT screenshot",
        actor,
      });

      expect(updated.durationSeconds).toBe(13500);
      expect(updated.isOverride).toBe(true);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: actor.id,
            actionType: "HOURS_OVERRIDE",
            targetEntityId: "log-1",
            targetEntityType: "DAILY_STUDY_LOG",
            auditReason: "Timer app crashed; participant provided verified YPT screenshot",
          }),
        }),
      );
    });

    it("rejects override when audit reason is empty in repository", async () => {
      await expect(
        adminOverrideDailyStudyLog({
          challengeId: "chal-1",
          participantId: "part-1",
          logDate: "2026-09-02",
          durationSeconds: 3600,
          reason: "   ",
          actor,
        }),
      ).rejects.toThrow(/Audit reason is required/);
    });

    it("rejects override action when audit reason is fewer than 3 characters", async () => {
      const result = await overrideStudyHoursAction({
        challengeId: "chal-1",
        participantId: "part-1",
        logDate: "2026-09-02",
        durationSeconds: 3600,
        reason: "no",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/audit reason/i);
    });
  });

  describe("J5.2: Host Goal Management on Behalf of Participant", () => {
    it("allows host to edit goal description with audit reason", async () => {
      vi.mocked(prisma.weeklyGoal.findUnique).mockResolvedValueOnce({
        id: "goal-1",
        description: "Original goal",
        participant: { challengeId: "chal-1" },
      } as any);

      vi.mocked(prisma.weeklyGoal.update).mockResolvedValueOnce({
        id: "goal-1",
        description: "Updated syllabus goal",
      } as any);

      const result = await adminEditGoal({
        challengeId: "chal-1",
        goalId: "goal-1",
        description: "Updated syllabus goal",
        reason: "Syllabus was officially changed by instructor",
        actor,
      });

      expect(result.description).toBe("Updated syllabus goal");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionType: "GOAL_EDIT",
            targetEntityId: "goal-1",
            auditReason: "Syllabus was officially changed by instructor",
          }),
        }),
      );
    });

    it("allows host to toggle goal completion status", async () => {
      vi.mocked(prisma.weeklyGoal.findUnique).mockResolvedValueOnce({
        id: "goal-1",
        completed: false,
        participant: { challengeId: "chal-1" },
      } as any);

      vi.mocked(prisma.weeklyGoal.update).mockResolvedValueOnce({
        id: "goal-1",
        completed: true,
      } as any);

      const result = await adminToggleGoalCompletion({
        challengeId: "chal-1",
        goalId: "goal-1",
        completed: true,
        reason: "Confirmed completion via discord proof channel",
        actor,
      });

      expect(result.completed).toBe(true);
    });

    it("allows host to add a bonus goal up to 10 goals maximum", async () => {
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
        id: "part-1",
        challengeId: "chal-1",
      } as any);

      vi.mocked(prisma.weeklyGoal.findMany).mockResolvedValueOnce([
        { id: "g1", sortOrder: 0 },
        { id: "g2", sortOrder: 1 },
      ] as any);

      vi.mocked(prisma.weeklyGoal.create).mockResolvedValueOnce({
        id: "goal-new",
        description: "Bonus Problem Set 5",
        sortOrder: 2,
      } as any);

      const result = await adminAddGoal({
        challengeId: "chal-1",
        participantId: "part-1",
        description: "Bonus Problem Set 5",
        reason: "Host granted extra credit goal opportunity",
        actor,
      });

      expect(result.id).toBe("goal-new");
      expect(result.sortOrder).toBe(2);
    });
  });

  describe("J5.3: Security & Authorization Boundary Verification", () => {
    it("rejects cross-challenge forgery when host attempts to override participant of another challenge", async () => {
      vi.mocked(prisma.challengeParticipant.findUnique).mockResolvedValueOnce({
        id: "part-foreign",
        challengeId: "chal-other", // belongs to chal-other!
      } as any);

      await expect(
        adminOverrideDailyStudyLog({
          challengeId: "chal-1", // host is authorized for chal-1
          participantId: "part-foreign",
          logDate: "2026-09-02",
          durationSeconds: 14400,
          reason: "Malicious cross-challenge modification",
          actor,
        }),
      ).rejects.toThrow(/Participant does not belong to this challenge/);
    });

    it("rejects cross-challenge forgery when host attempts to edit goal of another challenge", async () => {
      vi.mocked(prisma.weeklyGoal.findUnique).mockResolvedValueOnce({
        id: "goal-foreign",
        description: "Other challenge goal",
        participant: { challengeId: "chal-other" },
      } as any);

      await expect(
        adminEditGoal({
          challengeId: "chal-1",
          goalId: "goal-foreign",
          description: "Tampered description",
          reason: "Malicious edit",
          actor,
        }),
      ).rejects.toThrow(/Goal does not belong to this challenge/);
    });

    it("rejects non-admin or unauthorized user attempting override actions", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "regular-student", role: "USER" },
      } as any);

      vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
        id: "chal-1",
        creatorId: "different-host",
      } as any);

      await expect(
        overrideStudyHoursAction({
          challengeId: "chal-1",
          participantId: "part-1",
          logDate: "2026-09-02",
          durationSeconds: 14400,
          reason: "Attempt by non-host",
        }),
      ).rejects.toThrow(AdminAccessError);
    });
  });
});
