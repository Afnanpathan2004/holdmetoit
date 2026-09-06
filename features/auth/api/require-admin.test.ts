import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdminOrHost, AdminAccessError } from "./require-admin";
import * as requireSessionModule from "./require-session";
import { prisma } from "@/core/db";

vi.mock("./require-session", () => ({
  requireSessionUser: vi.fn(),
  AuthError: class AuthError extends Error {},
}));

vi.mock("@/core/db", () => ({
  prisma: {
    challenge: {
      findUnique: vi.fn(),
    },
  },
}));

describe("requireAdminOrHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permits users with ADMIN role unconditionally", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
      id: "u-admin",
      role: "ADMIN",
    } as any);

    const user = await requireAdminOrHost();
    expect(user.id).toBe("u-admin");
    expect(prisma.challenge.findUnique).not.toHaveBeenCalled();
  });

  it("permits users who are designated hostId of the challenge", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
      id: "u-host",
      role: "PARTICIPANT",
    } as any);

    vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
      hostId: "u-host",
    } as any);

    const user = await requireAdminOrHost("chal-1");
    expect(user.id).toBe("u-host");
    expect(prisma.challenge.findUnique).toHaveBeenCalledWith({
      where: { id: "chal-1" },
      select: { hostId: true },
    });
  });

  it("throws AdminAccessError for non-admin participants without host rights", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
      id: "u-regular",
      role: "PARTICIPANT",
    } as any);

    vi.mocked(prisma.challenge.findUnique).mockResolvedValueOnce({
      hostId: "u-someone-else",
    } as any);

    await expect(requireAdminOrHost("chal-1")).rejects.toThrow(AdminAccessError);
  });

  it("throws AdminAccessError when no challengeId is provided for non-admin user", async () => {
    vi.mocked(requireSessionModule.requireSessionUser).mockResolvedValueOnce({
      id: "u-regular",
      role: "PARTICIPANT",
    } as any);

    await expect(requireAdminOrHost()).rejects.toThrow(AdminAccessError);
  });
});

