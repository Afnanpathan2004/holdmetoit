import { describe, expect, it } from "vitest";

import {
  getChallengeDayBuckets,
  getChallengeDayDateKey,
  getChallengeDayNumber,
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
