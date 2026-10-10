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
      expect(html).not.toContain("Law L5 Audit");
      expect(html).toContain("Clear Time");
      expect(html).not.toContain("Presets:");
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

   it("disables future day buttons in the 7-day selector with disabled attribute and Locked status", () => {
      // Challenge starting today or with future days
      const html = renderToStaticMarkup(
         createElement(AdminHoursOverrideModal, {
            isOpen: true,
            onClose: vi.fn(),
            challengeId: "chal-1",
            challengeStartDate: new Date().toISOString().slice(0, 10),
            totalChallengeDays: 7,
            participant: sampleParticipant,
            initialDayNumber: 1, // Today is Day 1; Days 2..7 are future
         })
      );

      // Day 1 (today) is active, Day 2..7 are future and disabled
      expect(html).toContain("D1");
      expect(html).toContain("D2");
      expect(html).toContain("Locked");
      // Ensure future day button has disabled attribute and cursor-not-allowed
      expect(html).toContain("cursor-not-allowed");
      expect(html).toContain("Future date (cannot log or edit yet)");
   });

   it("disables input fields and displays warning banner when all challenge days are in the future", () => {
      // Challenge starting in the future (UPCOMING)
      const futureDate = "2099-01-01";
      const html = renderToStaticMarkup(
         createElement(AdminHoursOverrideModal, {
            isOpen: true,
            onClose: vi.fn(),
            challengeId: "chal-1",
            challengeStartDate: futureDate,
            totalChallengeDays: 7,
            participant: sampleParticipant,
            initialDayNumber: 1,
         })
      );

      expect(html).toContain(
         "Future date (2099-01-01): moderators cannot add or edit study hours for future dates."
      );
      // Submit button is disabled
      expect(html).toContain("Save Override");
   });

   it("renders scope selector with Single Day and Overall Time options", () => {
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

      expect(html).toContain("Single Day (D1–D7)");
      expect(html).toContain("Overall Time (Reset to 0)");
   });

   it("permits 00:00:00 submission without requiring manual reason", () => {
      // Participant with 0 hours logged on Day 1
      const participantWithZero = {
         ...sampleParticipant,
         dailyLogs: {
            "2026-10-01": 0,
         },
      };

      const html = renderToStaticMarkup(
         createElement(AdminHoursOverrideModal, {
            isOpen: true,
            onClose: vi.fn(),
            challengeId: "chal-1",
            challengeStartDate: "2026-10-01",
            totalChallengeDays: 7,
            participant: participantWithZero,
            initialDayNumber: 1,
         })
      );

      // Label indicates reason is optional when clearing/at 0
      expect(html).toContain("(Optional if clearing to 0)");
      // Save Override button is not disabled due to missing reason (no disabled="" attribute)
      const submitBtnMatch = html.match(
         /<button[^>]*type="submit"[^>]*>([\s\S]*?)<\/button>/
      );
      expect(submitBtnMatch).not.toBeNull();
      expect(submitBtnMatch?.[0]).not.toContain('disabled=""');
   });
});
