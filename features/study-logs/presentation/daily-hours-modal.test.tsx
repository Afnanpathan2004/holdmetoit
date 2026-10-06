import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DailyHoursModal } from "./daily-hours-modal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/study-logs/api/log-study-time.actions", () => ({
  logStudyTimeAction: vi.fn(),
}));

describe("DailyHoursModal", () => {
  it("renders with empty inputs and 'Submit' when no hours have been logged today", () => {
    const html = renderToStaticMarkup(
      createElement(DailyHoursModal, {
        challengeId: "chal-1",
        isOpen: true,
        onClose: vi.fn(),
        todayDate: "2026-10-04",
        todayDayNumber: 2,
        todayLoggedSeconds: 0,
        yesterdayDate: "2026-10-03",
        yesterdayDayNumber: 1,
        yesterdayLoggedSeconds: 0,
        isYesterdayMissed: false,
      }),
    );

    expect(html).toContain("How much did you study today?");
    expect(html).toContain("Submit");
    expect(html).not.toContain("Update Hours");
    expect(html).not.toContain("Previously committed:");
    expect(html).not.toContain("Yesterday (2026-10-03)");
  });

  it("pre-populates inputs and displays 'Update Hours' when user has previously committed hours without 'Previously committed' badge", () => {
    // 9,035 seconds = 2h 30m 35s
    const html = renderToStaticMarkup(
      createElement(DailyHoursModal, {
        challengeId: "chal-1",
        isOpen: true,
        onClose: vi.fn(),
        todayDate: "2026-10-04",
        todayDayNumber: 2,
        todayLoggedSeconds: 9035,
        yesterdayDate: "2026-10-03",
        yesterdayDayNumber: 1,
        yesterdayLoggedSeconds: 0,
      }),
    );

    expect(html).toContain("How much did you study today?");
    expect(html).toContain('value="2"');
    expect(html).toContain('value="30"');
    expect(html).toContain('value="35"');
    expect(html).toContain("Update Hours");
    expect(html).not.toContain("Previously committed");
    expect(html).not.toContain("02:30:35");
  });

  it("shows 'Yesterday' toggle when isYesterdayMissed is true and pre-populates yesterday's hours when opened with initialDayNumber", () => {
    // 3,600 seconds = 1h
    const html = renderToStaticMarkup(
      createElement(DailyHoursModal, {
        challengeId: "chal-1",
        isOpen: true,
        onClose: vi.fn(),
        todayDate: "2026-10-04",
        todayDayNumber: 2,
        todayLoggedSeconds: 0,
        yesterdayDate: "2026-10-03",
        yesterdayDayNumber: 1,
        yesterdayLoggedSeconds: 3600,
        isYesterdayMissed: true,
        initialDayNumber: 1,
      }),
    );

    expect(html).toContain("How much did you study yesterday?");
    expect(html).toContain("Yesterday (2026-10-03)");
    expect(html).toContain("Today (2026-10-04)");
    expect(html).toContain('value="1"');
    expect(html).toContain('value="0"');
    expect(html).toContain("Update Hours");
    expect(html).not.toContain("Previously committed");
  });

  it("hides 'Yesterday' toggle and defaults to today if isYesterdayMissed is false even if initialDate is yesterday", () => {
    const html = renderToStaticMarkup(
      createElement(DailyHoursModal, {
        challengeId: "chal-1",
        isOpen: true,
        onClose: vi.fn(),
        todayDate: "2026-10-04",
        todayDayNumber: 2,
        todayLoggedSeconds: 0,
        yesterdayDate: "2026-10-03",
        yesterdayDayNumber: 1,
        yesterdayLoggedSeconds: 3600,
        isYesterdayMissed: false,
        initialDayNumber: 1,
      }),
    );

    expect(html).toContain("How much did you study today?");
    expect(html).not.toContain("Yesterday (2026-10-03)");
    expect(html).not.toContain("Today (2026-10-04)");
    expect(html).not.toContain("Previously committed");
  });

  it("renders null when isOpen is false", () => {
    const html = renderToStaticMarkup(
      createElement(DailyHoursModal, {
        challengeId: "chal-1",
        isOpen: false,
        onClose: vi.fn(),
        todayDate: "2026-10-04",
        todayDayNumber: 1,
      }),
    );

    expect(html).toBe("");
  });

  it("renders day-of-the-week selector with future days disabled and date picker with max constraint", () => {
    const html = renderToStaticMarkup(
      createElement(DailyHoursModal, {
        challengeId: "chal-1",
        isOpen: true,
        onClose: vi.fn(),
        todayDate: "2026-10-06",
        todayDayNumber: 2,
        challengeStartDate: "2026-10-05",
        totalChallengeDays: 7,
      }),
    );

    expect(html).toContain("Challenge Week Days");
    // Day 1 (past) and Day 2 (today)
    expect(html).toContain("D1");
    expect(html).toContain("Today");
    // Date picker input with max set to today
    expect(html).toContain('type="date"');
    expect(html).toContain('max="2026-10-06"');
    expect(html).toContain('min="2026-10-05"');
    // Future days are disabled
    expect(html).toContain('disabled=""');
    expect(html).toContain("Future date (cannot log yet)");
  });

  it("pre-populates past day hours when opened with initialDayNumber for an earlier day of the week", () => {
    const html = renderToStaticMarkup(
      createElement(DailyHoursModal, {
        challengeId: "chal-1",
        isOpen: true,
        onClose: vi.fn(),
        todayDate: "2026-10-07",
        todayDayNumber: 3,
        initialDayNumber: 1,
        challengeStartDate: "2026-10-05",
        existingLogs: {
          "2026-10-05": 7200, // 2 hours on Day 1
        },
      }),
    );

    expect(html).toContain("How much did you study on Day 1?");
    expect(html).toContain('value="2"');
    expect(html).toContain("Update Hours");
  });
});

