import { describe, expect, it } from "vitest";
import { rankParticipants, ParticipantStandingInput } from "./standings";
import { DurationRangeError } from "@/features/study-logs/domain/duration";

describe("rankParticipants", () => {
  const baseDate = new Date("2026-09-01T00:00:00Z");

  it("returns an empty array when given an empty list", () => {
    expect(rankParticipants([])).toEqual([]);
  });

  it("ranks participants strictly by totalLoggedSeconds descending", () => {
    const participants: ParticipantStandingInput[] = [
      {
        id: "p1",
        totalLoggedSeconds: 3600,
        targetSeconds: 7200,
        enrolledAt: baseDate,
        completedGoalsCount: 1,
        totalGoalsCount: 2,
      },
      {
        id: "p2",
        totalLoggedSeconds: 7200,
        targetSeconds: 7200,
        enrolledAt: baseDate,
        completedGoalsCount: 2,
        totalGoalsCount: 2,
      },
      {
        id: "p3",
        totalLoggedSeconds: 1800,
        targetSeconds: 7200,
        enrolledAt: baseDate,
        completedGoalsCount: 0,
        totalGoalsCount: 2,
      },
    ];

    const ranked = rankParticipants(participants);
    expect(ranked).toHaveLength(3);
    expect(ranked[0].item.id).toBe("p2");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].isPodium).toBe(1);
    expect(ranked[0].progressPercent).toBe(100);

    expect(ranked[1].item.id).toBe("p1");
    expect(ranked[1].rank).toBe(2);
    expect(ranked[1].isPodium).toBe(2);
    expect(ranked[1].progressPercent).toBe(50);

    expect(ranked[2].item.id).toBe("p3");
    expect(ranked[2].rank).toBe(3);
    expect(ranked[2].isPodium).toBe(3);
    expect(ranked[2].progressPercent).toBe(25);
  });

  it("assigns null to isPodium for 4th rank and beyond", () => {
    const participants: ParticipantStandingInput[] = [
      { id: "p1", totalLoggedSeconds: 4000, targetSeconds: 10000, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
      { id: "p2", totalLoggedSeconds: 3000, targetSeconds: 10000, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
      { id: "p3", totalLoggedSeconds: 2000, targetSeconds: 10000, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
      { id: "p4", totalLoggedSeconds: 1000, targetSeconds: 10000, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
    ];

    const ranked = rankParticipants(participants);
    expect(ranked[3].rank).toBe(4);
    expect(ranked[3].isPodium).toBeNull();
  });

  it("uses standard competition ranking (1224) when participants have identical totalLoggedSeconds", () => {
    const participants: ParticipantStandingInput[] = [
      { id: "p1", totalLoggedSeconds: 5000, targetSeconds: 10000, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
      { id: "p2", totalLoggedSeconds: 5000, targetSeconds: 5000, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
      { id: "p3", totalLoggedSeconds: 2000, targetSeconds: 5000, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
    ];

    const ranked = rankParticipants(participants);
    // p2 has higher completion ratio (100% vs 50%), so sorted first
    expect(ranked[0].item.id).toBe("p2");
    expect(ranked[0].rank).toBe(1);

    // p1 has same logged seconds, shares rank 1
    expect(ranked[1].item.id).toBe("p1");
    expect(ranked[1].rank).toBe(1);

    // p3 gets rank 3 (not 2)
    expect(ranked[2].item.id).toBe("p3");
    expect(ranked[2].rank).toBe(3);
  });

  it("breaks ties deterministically using completion ratio, enrollment date, and id", () => {
    const d1 = new Date("2026-09-01T01:00:00Z");
    const d2 = new Date("2026-09-01T02:00:00Z");

    const participants: ParticipantStandingInput[] = [
      // Same seconds, same ratio, but d2 (later) vs d1 (earlier)
      { id: "p-beta", totalLoggedSeconds: 3000, targetSeconds: 6000, enrolledAt: d2, completedGoalsCount: 0, totalGoalsCount: 0 },
      { id: "p-alpha", totalLoggedSeconds: 3000, targetSeconds: 6000, enrolledAt: d1, completedGoalsCount: 0, totalGoalsCount: 0 },
    ];

    const ranked = rankParticipants(participants);
    expect(ranked[0].item.id).toBe("p-alpha"); // earlier enrolled
    expect(ranked[1].item.id).toBe("p-beta");

    // When dates are identical, breaks by id alphabetically
    const participantsSameDate: ParticipantStandingInput[] = [
      { id: "zebra", totalLoggedSeconds: 3000, targetSeconds: 6000, enrolledAt: d1, completedGoalsCount: 0, totalGoalsCount: 0 },
      { id: "apple", totalLoggedSeconds: 3000, targetSeconds: 6000, enrolledAt: d1, completedGoalsCount: 0, totalGoalsCount: 0 },
    ];
    const rankedAlphabetical = rankParticipants(participantsSameDate);
    expect(rankedAlphabetical[0].item.id).toBe("apple");
    expect(rankedAlphabetical[1].item.id).toBe("zebra");
  });

  it("throws DurationRangeError on invalid totalLoggedSeconds or targetSeconds", () => {
    expect(() =>
      rankParticipants([
        { id: "p1", totalLoggedSeconds: -10, targetSeconds: 100, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
      ]),
    ).toThrow(DurationRangeError);

    expect(() =>
      rankParticipants([
        { id: "p1", totalLoggedSeconds: 10.5, targetSeconds: 100, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
      ]),
    ).toThrow(DurationRangeError);

    expect(() =>
      rankParticipants([
        { id: "p1", totalLoggedSeconds: 10, targetSeconds: -5, enrolledAt: baseDate, completedGoalsCount: 0, totalGoalsCount: 0 },
      ]),
    ).toThrow(DurationRangeError);
  });
});

