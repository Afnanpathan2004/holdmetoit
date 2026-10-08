import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminHoursOverrideModal } from "./admin-hours-override-modal";

vi.mock("next/navigation", () => ({
   useRouter: () => ({
      refresh: vi.fn(),
   }),
}));

vi.mock("@/features/study-logs/api/admin-override.actions", () => ({
   adminOverrideStudyHoursAction: vi.fn(),
}));

describe("AdminHoursOverrideModal", () => {
   const sampleParticipant = {
      participantId: "p_1",
      displayName: "Alice Scholar",
      username: "alice",
      teamName: "Honey Bees",
      teamColor: "#FFB066",
      dailyLogs: {
         "2026-10-01": 7200, // Day 1: 2h
         "2026-10-02": 14400, // Day 2: 4h
      },
   };

   it("returns null when isOpen is false", () => {
      const html = renderToStaticMarkup(
         createElement(AdminHoursOverrideModal, {
            isOpen: false,
            onClose: vi.fn(),
            challengeId: "chal-1",
            challengeStartDate: "2026-10-01",
            participant: sampleParticipant,
         })
      );

      expect(html).toBe("");
   });

   it("renders participant details, all 7 challenge week days, and audit notice", () => {
      const html = renderToStaticMarkup(
         createElement(AdminHoursOverrideModal, {
            isOpen: true,
            onClose: vi.fn(),
            challengeId: "chal-1",
            challengeStartDate: "2026-10-01",
            totalChallengeDays: 7,
            participant: sampleParticipant,
            initialDayNumber: 1,
         })
      );

      expect(html).toContain("Alice Scholar");
      expect(html).toContain("@alice");
      expect(html).toContain("Honey Bees");
      expect(html).toContain("Edit Participant Study Hours");
      expect(html).toContain("Law L5 Audit");
      expect(html).toContain("Mandatory Reason for Override");
      // All 7 days should be present in the day grid
      expect(html).toContain("D1");
      expect(html).toContain("D2");
      expect(html).toContain("D3");
      expect(html).toContain("D4");
      expect(html).toContain("D5");
      expect(html).toContain("D6");
      expect(html).toContain("D7");
   });

   it("pre-populates inputs for initialDayNumber when existing logs are present", () => {
      // Day 1 has 7200 seconds = 2h 0m 0s
      const html = renderToStaticMarkup(
         createElement(AdminHoursOverrideModal, {
            isOpen: true,
            onClose: vi.fn(),
            challengeId: "chal-1",
            challengeStartDate: "2026-10-01",
            totalChallengeDays: 7,
            participant: sampleParticipant,
            initialDayNumber: 1,
         })
      );

      expect(html).toContain('value="2"'); // 2 hours
      expect(html).toContain('value="0"'); // 0 minutes
      expect(html).toContain("Currently Logged on Day 1:");
      expect(html).toContain("02:00:00");
   });

   it("pre-populates Day 2 hours when initialDayNumber is 2", () => {
      // Day 2 has 14400 seconds = 4h 0m 0s
      const html = renderToStaticMarkup(
         createElement(AdminHoursOverrideModal, {
            isOpen: true,
            onClose: vi.fn(),
            challengeId: "chal-1",
            challengeStartDate: "2026-10-01",
            totalChallengeDays: 7,
            participant: sampleParticipant,
            initialDayNumber: 2,
         })
      );

      expect(html).toContain('value="4"'); // 4 hours
      expect(html).toContain("Currently Logged on Day 2:");
      expect(html).toContain("04:00:00");
   });

   it("enables all 7 day buttons for mods/devs without disabled attribute on past days", () => {
      const html = renderToStaticMarkup(
         createElement(AdminHoursOverrideModal, {
            isOpen: true,
            onClose: vi.fn(),
            challengeId: "chal-1",
            challengeStartDate: "2026-10-01",
            totalChallengeDays: 7,
            participant: sampleParticipant,
            initialDayNumber: 1,
         })
      );

      // Unlike participant DailyHoursModal which has disabled buttons for non-today/yesterday,
      // the admin override modal permits mods to click any day
      const dayButtonsHtml = html.slice(html.indexOf("Select Challenge Day"));
      // Ensure D1, D2, D3 etc. do not have "disabled" in their button markup
      expect(dayButtonsHtml).not.toMatch(
         /<button[^>]*disabled[^>]*>[^<]*<span[^>]*>[^<]*<\/span><span[^>]*>D1<\/span>/
      );
   });
});
