import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/(dashboard)/dashboard/page";
import LoginPage from "@/app/login/page";
import AdminLayout from "@/app/(admin)/layout";
import * as authModule from "@/core/auth";
import * as cockpitModule from "@/features/study-logs/data/cockpit-data";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/core/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/features/study-logs/data/cockpit-data", () => ({
  getParticipantCockpit: vi.fn(),
}));

describe("Journey: Authentication Entry Point & Protected Route Redirection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Protected Route Redirection (Unauthenticated Access)", () => {
    it("redirects unauthenticated users accessing /dashboard to /login?callbackUrl=/dashboard", async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null as never);

      await expect(DashboardPage({})).rejects.toThrow(
        "NEXT_REDIRECT:/login?callbackUrl=%2Fdashboard",
      );
      expect(mockRedirect).toHaveBeenCalledWith(
        "/login?callbackUrl=%2Fdashboard",
      );
    });

    it("preserves challenge query param in callbackUrl on /dashboard redirect", async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null as never);

      await expect(
        DashboardPage({ searchParams: { challenge: "chal-midterm" } }),
      ).rejects.toThrow(
        "NEXT_REDIRECT:/login?callbackUrl=%2Fdashboard%3Fchallenge%3Dchal-midterm",
      );
    });

    it("redirects unauthenticated users accessing /admin to /login?callbackUrl=/admin", async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null as never);

      await expect(
        AdminLayout({ children: "Admin Content" }),
      ).rejects.toThrow("NEXT_REDIRECT:/login?callbackUrl=/admin");
      expect(mockRedirect).toHaveBeenCalledWith("/login?callbackUrl=/admin");
    });
  });

  describe("Authenticated User Route Access", () => {
    it("redirects already authenticated users visiting /login to callbackUrl or /dashboard", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "usr-demo-dev", role: "ADMIN", name: "Demo Admin" },
        expires: "2099-01-01",
      } as never);

      await expect(
        LoginPage({ searchParams: { callbackUrl: "/admin" } }),
      ).rejects.toThrow("NEXT_REDIRECT:/admin");
      expect(mockRedirect).toHaveBeenCalledWith("/admin");
    });

    it("allows authenticated participant to render /dashboard", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "usr-participant-1", role: "PARTICIPANT", name: "Student" },
        expires: "2099-01-01",
      } as never);

      vi.mocked(cockpitModule.getParticipantCockpit).mockResolvedValue({
        participant: {
          id: "part-1",
          userId: "usr-participant-1",
          username: "student",
          displayName: "Student",
          avatarUrl: null,
          teamName: "Honey Bees",
          teamColor: "#d9822b",
          teamIconEmoji: "🐝",
          challengeId: "chal-1",
          challengeTitle: "Sprint 1",
          challengeStatus: "ACTIVE",
          targetHoursFormatted: "25:00:00",
          targetSeconds: 90000,
          totalLoggedSeconds: 36000,
          totalLoggedFormatted: "10:00:00",
          overallDeficitSeconds: 0,
          overallDeficitFormatted: "00:00:00",
          progressPercentage: 40,
          status: "NORMAL",
          daysRemaining: 4,
          requiredDailyPaceSeconds: 13500,
          requiredDailyPaceFormatted: "03:45:00",
          goalsCompletedCount: 1,
          goalsTotalCount: 3,
        },
        goals: [],
        dailyLogs: [],
      } as any);

      const jsx = await DashboardPage({});
      expect(jsx).toBeDefined();
      expect(cockpitModule.getParticipantCockpit).toHaveBeenCalledWith(
        "usr-participant-1",
        undefined,
      );
    });

    it("allows authenticated admin to render AdminLayout", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "usr-admin-1", role: "ADMIN", name: "Admin Host" },
        expires: "2099-01-01",
      } as never);

      const jsx = await AdminLayout({ children: "Admin Protected Content" });
      expect(jsx).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});

