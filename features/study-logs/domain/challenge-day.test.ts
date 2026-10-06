import { describe, expect, it } from "vitest";

import {
  getChallengeDayBuckets,
  getChallengeDayDateKey,
  getChallengeDayFromDateKey,
  getChallengeDayNumber,
  getChallengeDayOptions,
  getCalendarWeekDayOptions,
  validateStudyLogChallengeDay,
} from "./challenge-day";

describe("challenge day calculation", () => {
  const startAt = new Date("2026-10-05T18:00:00.000Z");

  it("keeps the same challenge day after UTC midnight", () => {
    expect(getChallengeDayNumber(startAt, "2026-10-06T00:30:00.000Z")).toBe(1);
    expect(getChallengeDayDateKey(startAt, 1)).toBe("2026-10-05");
  });

  it("moves to the next challenge day at the exact 24-hour boundary", () => {
    expect(getChallengeDayNumber(startAt, "2026-10-06T17:59:59.000Z")).toBe(1);
    expect(getChallengeDayNumber(startAt, "2026-10-06T18:00:00.000Z")).toBe(2);
    expect(getChallengeDayDateKey(startAt, 2)).toBe("2026-10-06");
  });

  it("returns no previous bucket on day one and the prior bucket thereafter", () => {
    expect(getChallengeDayBuckets(startAt, "2026-10-05T18:00:00.000Z")).toEqual({
      current: { dayNumber: 1, dateKey: "2026-10-05" },
      previous: null,
    });
    expect(getChallengeDayBuckets(startAt, "2026-10-06T18:00:00.000Z")).toEqual({
      current: { dayNumber: 2, dateKey: "2026-10-06" },
      previous: { dayNumber: 1, dateKey: "2026-10-05" },
    });
  });

  it("does not expose a pre-start day as day zero", () => {
    expect(getChallengeDayNumber(startAt, "2026-10-05T17:59:59.000Z")).toBe(0);
    expect(getChallengeDayBuckets(startAt, "2026-10-05T17:59:59.000Z").current).toEqual({
      dayNumber: 1,
      dateKey: "2026-10-05",
    });
  });
});

describe("getChallengeDayFromDateKey", () => {
  const startAt = new Date("2026-10-05T18:00:00.000Z");

  it("reverses getChallengeDayDateKey back to dayNumber", () => {
    expect(getChallengeDayFromDateKey(startAt, "2026-10-05")).toBe(1);
    expect(getChallengeDayFromDateKey(startAt, "2026-10-06")).toBe(2);
    expect(getChallengeDayFromDateKey(startAt, "2026-10-11")).toBe(7);
  });

  it("returns 0 or negative for dates before start", () => {
    expect(getChallengeDayFromDateKey(startAt, "2026-10-04")).toBe(0);
    expect(getChallengeDayFromDateKey(startAt, "2026-10-01")).toBe(-3);
  });

  it("throws on invalid date string format", () => {
    expect(() => getChallengeDayFromDateKey(startAt, "not-a-date")).toThrow(TypeError);
  });
});

describe("getChallengeDayOptions", () => {
  const startAt = new Date("2026-10-05T18:00:00.000Z"); // Monday Oct 5

  it("generates 7 day options when currently on day 3", () => {
    const now = new Date("2026-10-07T20:00:00.000Z"); // Day 3 (Wed)
    const options = getChallengeDayOptions(startAt, now, 7);

    expect(options).toHaveLength(7);

    // Day 1: Past
    expect(options[0]).toMatchObject({
      dayNumber: 1,
      dateKey: "2026-10-05",
      isToday: false,
      isYesterday: false,
      isFuture: false,
    });

    // Day 2: Yesterday
    expect(options[1]).toMatchObject({
      dayNumber: 2,
      dateKey: "2026-10-06",
      isToday: false,
      isYesterday: true,
      isFuture: false,
    });

    // Day 3: Today
    expect(options[2]).toMatchObject({
      dayNumber: 3,
      dateKey: "2026-10-07",
      isToday: true,
      isYesterday: false,
      isFuture: false,
    });

    // Day 4..7: Future
    expect(options[3].isFuture).toBe(true);
    expect(options[4].isFuture).toBe(true);
    expect(options[5].isFuture).toBe(true);
    expect(options[6].isFuture).toBe(true);
  });
});

describe("getCalendarWeekDayOptions", () => {
  it("generates 7 days of the ISO week with correct Monday start and today marker", () => {
    // 2026-10-07 is Wednesday (Day 3 in Mon-Sun week)
    const nowWed = new Date("2026-10-07T12:00:00.000Z");
    const options = getCalendarWeekDayOptions(nowWed);

    expect(options).toHaveLength(7);
    expect(options[0].dateKey).toBe("2026-10-05"); // Monday
    expect(options[0].weekday).toBe("Mon");
    expect(options[0].dayNumber).toBe(1);

    expect(options[1].dateKey).toBe("2026-10-06"); // Tuesday
    expect(options[1].isYesterday).toBe(true);

    expect(options[2].dateKey).toBe("2026-10-07"); // Wednesday (Today)
    expect(options[2].isToday).toBe(true);
    expect(options[2].weekday).toBe("Wed");

    expect(options[6].dateKey).toBe("2026-10-11"); // Sunday
    expect(options[6].weekday).toBe("Sun");
    expect(options[6].dayNumber).toBe(7);
    expect(options[6].isFuture).toBe(true);
  });
});

describe("validateStudyLogChallengeDay", () => {
  const startAt = new Date("2026-10-05T18:00:00.000Z");
  const nowDay3 = new Date("2026-10-07T20:00:00.000Z"); // Day 3 (2026-10-07)

  it("allows logging today (current day)", () => {
    const result = validateStudyLogChallengeDay(startAt, { challengeDay: 3 }, nowDay3);
    expect(result).toEqual({
      ok: true,
      dayNumber: 3,
      dateKey: "2026-10-07",
    });
  });

  it("allows logging yesterday (previous day)", () => {
    const result = validateStudyLogChallengeDay(startAt, { challengeDay: 2 }, nowDay3);
    expect(result).toEqual({
      ok: true,
      dayNumber: 2,
      dateKey: "2026-10-06",
    });
  });

  it("allows logging any past challenge day (e.g. Day 1)", () => {
    const result = validateStudyLogChallengeDay(startAt, { challengeDay: 1 }, nowDay3);
    expect(result).toEqual({
      ok: true,
      dayNumber: 1,
      dateKey: "2026-10-05",
    });
  });

  it("allows logging by explicit valid past or current date string", () => {
    const result = validateStudyLogChallengeDay(startAt, { date: "2026-10-06" }, nowDay3);
    expect(result).toEqual({
      ok: true,
      dayNumber: 2,
      dateKey: "2026-10-06",
    });
  });

  it("rejects future challenge day with FUTURE_DATE_NOT_ALLOWED", () => {
    const result = validateStudyLogChallengeDay(startAt, { challengeDay: 4 }, nowDay3);
    expect(result).toEqual({
      ok: false,
      code: "FUTURE_DATE_NOT_ALLOWED",
      message: "Cannot log study time for future dates.",
    });
  });

  it("rejects future date with FUTURE_DATE_NOT_ALLOWED", () => {
    const result = validateStudyLogChallengeDay(startAt, { date: "2026-10-08" }, nowDay3);
    expect(result).toEqual({
      ok: false,
      code: "FUTURE_DATE_NOT_ALLOWED",
      message: "Cannot log study time for future dates.",
    });
  });

  it("rejects challenge day < 1 with DATE_BEFORE_CHALLENGE", () => {
    const result = validateStudyLogChallengeDay(startAt, { challengeDay: 0 }, nowDay3);
    expect(result).toEqual({
      ok: false,
      code: "DATE_BEFORE_CHALLENGE",
      message: "Cannot log study time for days before the challenge started.",
    });
  });

  it("rejects date prior to challenge start with DATE_BEFORE_CHALLENGE", () => {
    const result = validateStudyLogChallengeDay(startAt, { date: "2026-10-04" }, nowDay3);
    expect(result).toEqual({
      ok: false,
      code: "DATE_BEFORE_CHALLENGE",
      message: "Cannot log study time for dates before the challenge started.",
    });
  });

  it("rejects mismatch between challengeDay and date", () => {
    const result = validateStudyLogChallengeDay(
      startAt,
      { challengeDay: 1, date: "2026-10-06" },
      nowDay3,
    );
    expect(result).toEqual({
      ok: false,
      code: "MISMATCHED_DATE_AND_DAY",
      message: "The provided challenge day and date do not match.",
    });
  });
});

