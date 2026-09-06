import { beforeEach, describe, expect, it, vi } from "vitest";

import { logStudyTimeAction } from "@/features/study-logs/api/log-study-time.action";
import * as requireSessionModule from "@/features/auth/api/require-session";
import * as requireParticipantModule from "@/features/auth/api/require-participant";
import * as dailyStudyLogRepo from "@/features/study-logs/data/daily-study-log.repository";

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

describe("logStudyTimeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves valid study duration during ACTIVE challenges", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
      id: "usr_1",
    } as never);

    vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
      id: "part_1",
      challenge: { status: "ACTIVE" },
    } as never);

    const result = await logStudyTimeAction({
      challengeId: "chal_1",
      logDate: "2026-09-06",
      hours: 4,
      minutes: 30,
      seconds: 0,
    });

    expect(result).toEqual({ ok: true });
    expect(dailyStudyLogRepo.upsertDailyStudyLog).toHaveBeenCalledWith({
      participantId: "part_1",
      logDate: "2026-09-06",
      durationSeconds: 16_200,
    });
  });

  it("accepts exactly 24:00:00 boundary", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
      id: "usr_1",
    } as never);

    vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
      id: "part_1",
      challenge: { status: "ACTIVE" },
    } as never);

    const result = await logStudyTimeAction({
      challengeId: "chal_1",
      logDate: "2026-09-06",
      hours: 24,
      minutes: 0,
      seconds: 0,
    });

    expect(result).toEqual({ ok: true });
    expect(dailyStudyLogRepo.upsertDailyStudyLog).toHaveBeenCalledWith({
      participantId: "part_1",
      logDate: "2026-09-06",
      durationSeconds: 86_400,
    });
  });

  it("rejects durations exceeding 24 hours (e.g. 24:00:01)", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
      id: "usr_1",
    } as never);

    vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
      id: "part_1",
      challenge: { status: "ACTIVE" },
    } as never);

    const result = await logStudyTimeAction({
      challengeId: "chal_1",
      logDate: "2026-09-06",
      hours: 24,
      minutes: 0,
      seconds: 1,
    });

    expect(result).toEqual({
      ok: false,
      code: "DAILY_LIMIT_EXCEEDED",
      message: "A single day cannot exceed 24:00:00 of study time.",
    });
    expect(dailyStudyLogRepo.upsertDailyStudyLog).not.toHaveBeenCalled();
  });

  it("rejects study logging when challenge is not ACTIVE", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
      id: "usr_1",
    } as never);

    vi.mocked(requireParticipantModule.requireOwnedParticipant).mockResolvedValue({
      id: "part_1",
      challenge: { status: "UPCOMING" },
    } as never);

    const result = await logStudyTimeAction({
      challengeId: "chal_1",
      logDate: "2026-09-06",
      hours: 2,
      minutes: 0,
      seconds: 0,
    });

    expect(result).toEqual({
      ok: false,
      code: "CHALLENGE_NOT_ACTIVE",
      message: "Study logging is only available during active challenges.",
    });
    expect(dailyStudyLogRepo.upsertDailyStudyLog).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated attempts with UNAUTHORIZED", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockRejectedValue(
      new requireSessionModule.AuthError(),
    );

    const result = await logStudyTimeAction({
      challengeId: "chal_1",
      logDate: "2026-09-06",
      hours: 1,
      minutes: 0,
      seconds: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("UNAUTHORIZED");
    }
  });

  it("rejects non-enrolled users with NOT_ENROLLED", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValue({
      id: "usr_1",
    } as never);

    vi.mocked(requireParticipantModule.requireOwnedParticipant).mockRejectedValue(
      new requireParticipantModule.ParticipantAccessError(),
    );

    const result = await logStudyTimeAction({
      challengeId: "chal_1",
      logDate: "2026-09-06",
      hours: 1,
      minutes: 0,
      seconds: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NOT_ENROLLED");
    }
  });
});

