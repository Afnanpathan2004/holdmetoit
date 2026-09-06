import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminOverrideStudyHoursAction } from "./admin-override.action";
import * as requireAdminModule from "@/features/auth/api/require-admin";
import * as overrideRepoModule from "@/features/study-logs/data/admin-override.repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/api/require-admin", () => ({
  AdminAccessError: class AdminAccessError extends Error {},
  requireAdminUser: vi.fn(),
}));

vi.mock("@/features/study-logs/data/admin-override.repository", () => ({
  executeAdminHoursOverride: vi.fn(),
}));

describe("adminOverrideStudyHoursAction (Law L5 / FEAT-LOG-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminModule.requireAdminUser).mockResolvedValue({
      id: "admin_1",
      username: "HostAdmin",
      displayName: "Host Admin",
      role: "ADMIN",
    });
  });

  it("successfully records hours override with valid duration and audit reason", async () => {
    vi.mocked(overrideRepoModule.executeAdminHoursOverride).mockResolvedValue({} as never);

    const result = await adminOverrideStudyHoursAction({
      challengeId: "c_1",
      participantId: "p_1",
      logDate: "2026-09-05",
      hours: 4,
      minutes: 30,
      seconds: 0,
      reason: "Timer app crashed during evening session",
    });

    expect(result).toEqual({ ok: true });
    expect(overrideRepoModule.executeAdminHoursOverride).toHaveBeenCalledWith({
      participantId: "p_1",
      logDate: "2026-09-05",
      durationSeconds: 16200,
      reason: "Timer app crashed during evening session",
      admin: { id: "admin_1", username: "HostAdmin" },
    });
  });

  it("rejects duration exceeding 24 hours (86,400s)", async () => {
    const result = await adminOverrideStudyHoursAction({
      challengeId: "c_1",
      participantId: "p_1",
      logDate: "2026-09-05",
      hours: 24,
      minutes: 1,
      seconds: 0,
      reason: "Typo test",
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      code: "DAILY_LIMIT_EXCEEDED",
    });
  });

  it("rejects when reason is too short", async () => {
    const result = await adminOverrideStudyHoursAction({
      challengeId: "c_1",
      participantId: "p_1",
      logDate: "2026-09-05",
      hours: 2,
      minutes: 0,
      seconds: 0,
      reason: "a",
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      code: "INVALID_INPUT",
    });
  });
});
