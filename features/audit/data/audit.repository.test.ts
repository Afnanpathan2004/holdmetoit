import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAuditEntry,
  getAuditLogsForEntities,
  getAuditLogsForEntity,
  getRecentAuditLogs,
} from "./audit.repository";
import { prisma } from "@/core/db";

vi.mock("@/core/db", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("audit.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an audit log entry with serialized snapshots", async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({
      id: "audit-1",
      timestamp: new Date(),
      actorId: "admin-1",
      actorUsername: "host_alex",
      actionType: "HOURS_OVERRIDE",
      targetEntityId: "log-1",
      targetEntityType: "DAILY_STUDY_LOG",
      previousValue: JSON.stringify({ durationSeconds: 3600 }),
      newValue: JSON.stringify({ durationSeconds: 7200 }),
      auditReason: "Corrected timer glitch",
    });

    const result = await createAuditEntry({
      actorId: "admin-1",
      actorUsername: "host_alex",
      actionType: "HOURS_OVERRIDE",
      targetEntityId: "log-1",
      targetEntityType: "DAILY_STUDY_LOG",
      previousValue: { durationSeconds: 3600 },
      newValue: { durationSeconds: 7200 },
      auditReason: "Corrected timer glitch",
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: "admin-1",
        actorUsername: "host_alex",
        actionType: "HOURS_OVERRIDE",
        targetEntityId: "log-1",
        targetEntityType: "DAILY_STUDY_LOG",
        previousValue: JSON.stringify({ durationSeconds: 3600 }),
        newValue: JSON.stringify({ durationSeconds: 7200 }),
        auditReason: "Corrected timer glitch",
      },
    });
    expect(result.id).toBe("audit-1");
  });

  it("fetches audit logs for a specific entity ordered by timestamp desc", async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([]);

    await getAuditLogsForEntity("chal-1", 20);

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: { targetEntityId: "chal-1" },
      orderBy: { timestamp: "desc" },
      take: 20,
    });
  });

  it("fetches recent audit logs for the admin dashboard", async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([]);

    await getRecentAuditLogs(30);

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      orderBy: { timestamp: "desc" },
      take: 30,
    });
  });

  it("fetches audit logs for multiple entities", async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([]);

    await getAuditLogsForEntities(["e-1", "e-2"], 25);

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: { targetEntityId: { in: ["e-1", "e-2"] } },
      orderBy: { timestamp: "desc" },
      take: 25,
    });
  });
});
