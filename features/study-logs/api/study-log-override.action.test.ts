import { beforeEach, describe, expect, it, vi } from "vitest";

import { overrideStudyHoursAction } from "./study-log-override.action";
import * as requireAdminModule from "@/features/auth/api/require-admin";
import * as dailyStudyLogRepo from "@/features/study-logs/data/daily-study-log.repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/api/require-admin", () => ({
  requireAdminOrHost: vi.fn(),
  AdminAccessError: class AdminAccessError extends Error {},
}));

vi.mock("@/features/study-logs/data/daily-study-log.repository", () => ({
  adminOverrideDailyStudyLog: vi.fn(),
}));

describe("study-log-override.action", () => {
  const mockAdmin = { id: "admin-1", username: "host_alex", role: "ADMIN" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminModule.requireAdminOrHost).mockResolvedValue(mockAdmin as any);
  });

  it("successfully overrides study hours with valid input and audit reason", async () => {
    vi.mocked(dailyStudyLogRepo.adminOverrideDailyStudyLog).mockResolvedValueOnce({
      id: "log-1",
    } as any);

    const result = await overrideStudyHoursAction({
      challengeId: "chal-1",
      participantId: "part-1",
      logDate: "2026-09-02",
      durationSeconds: 14400,
      reason: "Timer crash verified via YPT screenshot",
    });

    expect(result).toEqual({ ok: true, logId: "log-1" });
    expect(dailyStudyLogRepo.adminOverrideDailyStudyLog).toHaveBeenCalledWith({
      challengeId: "chal-1",
      participantId: "part-1",
      logDate: "2026-09-02",
      durationSeconds: 14400,
      reason: "Timer crash verified via YPT screenshot",
      actor: { id: "admin-1", username: "host_alex" },
    });
  });

  it("rejects override when reason is too short", async () => {
    const result = await overrideStudyHoursAction({
      challengeId: "chal-1",
      participantId: "part-1",
      logDate: "2026-09-02",
      durationSeconds: 14400,
      reason: "no",
    });

    expect(result.ok).toBe(false);
    expect(dailyStudyLogRepo.adminOverrideDailyStudyLog).not.toHaveBeenCalled();
  });

  it("rejects override when duration exceeds 86,400 seconds (24h)", async () => {
    const result = await overrideStudyHoursAction({
      challengeId: "chal-1",
      participantId: "part-1",
      logDate: "2026-09-02",
      durationSeconds: 90000,
      reason: "Over 24h",
    });

    expect(result.ok).toBe(false);
    expect(dailyStudyLogRepo.adminOverrideDailyStudyLog).not.toHaveBeenCalled();
  });
});

