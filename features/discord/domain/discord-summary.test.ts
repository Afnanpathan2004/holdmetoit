import { describe, expect, it } from "vitest";

import { generateDiscordSummary, DiscordSummaryInput } from "./discord-summary";

describe("discord-summary domain", () => {
  const baseInput: DiscordSummaryInput = {
    challenge: {
      id: "chal-1",
      title: "Autumn Café Clash",
      format: "TEAM_VS_TEAM",
      status: "UPCOMING",
      startAt: new Date("2026-09-01T00:00:00Z"),
      endAt: new Date("2026-09-08T00:00:00Z"),
    },
    teams: [
      {
        id: "t1",
        name: "Honey Bees",
        iconEmoji: "🐝",
        totalSeconds: 36000,
        memberCount: 2,
      },
      {
        id: "t2",
        name: "Lavender Butterflies",
        iconEmoji: "🦋",
        totalSeconds: 25200,
        memberCount: 2,
      },
    ],
    leadMargin: {
      marginSeconds: 10800,
      leader: "a",
      leadingTeam: { name: "Honey Bees" },
      isTie: false,
    },
    participants: [
      {
        id: "p1",
        displayName: "Alice",
        username: "alice_bee",
        teamName: "Honey Bees",
        totalLoggedSeconds: 36000,
        targetSeconds: 36000,
        progressPercent: 100,
        rank: 1,
        completedGoalsCount: 3,
        totalGoalsCount: 3,
        punishmentEvaluation: {
          isPunished: false,
          hoursDeficitSeconds: 0,
          incompleteGoals: 0,
        },
      },
      {
        id: "p2",
        displayName: "Bob",
        username: "bob_flutter",
        teamName: "Lavender Butterflies",
        totalLoggedSeconds: 20000,
        targetSeconds: 36000,
        progressPercent: 55,
        rank: 2,
        completedGoalsCount: 1,
        totalGoalsCount: 2,
        punishmentEvaluation: {
          isPunished: true,
          hoursDeficitSeconds: 16000,
          incompleteGoals: 1,
        },
      },
    ],
  };

  it("generates markdown summary for UPCOMING challenges", () => {
    const markdown = generateDiscordSummary({
      ...baseInput,
      challenge: { ...baseInput.challenge, status: "UPCOMING" },
    });

    expect(markdown).toContain("# 📅 Upcoming Challenge: Autumn Café Clash");
    expect(markdown).toContain("Team vs Team (Houses)");
    expect(markdown).toContain("Honey Bees");
    expect(markdown).toContain("Lavender Butterflies");
    expect(markdown).toContain("Alice (@alice_bee)");
  });

  it("generates markdown summary for ACTIVE challenges with lead margin and podium", () => {
    const markdown = generateDiscordSummary({
      ...baseInput,
      challenge: { ...baseInput.challenge, status: "ACTIVE" },
    });

    expect(markdown).toContain("# ⚡ Live Match Standings: Autumn Café Clash");
    expect(markdown).toContain("Honey Bees ahead by `3h`");
    expect(markdown).toContain("🥇 **Alice** — `10:00:00`");
    expect(markdown).toContain("🥈 **Bob** — `05:33:20`");
  });

  it("generates tied match summary for ACTIVE challenges when isTie is true", () => {
    const markdown = generateDiscordSummary({
      ...baseInput,
      challenge: { ...baseInput.challenge, status: "ACTIVE" },
      leadMargin: {
        marginSeconds: 0,
        leader: "tie",
        leadingTeam: null,
        isTie: true,
      },
    });

    expect(markdown).toContain("Tied Match (All Square)");
  });

  it("generates markdown summary for COMPLETED challenges with forfeits and pardons", () => {
    const completedInput: DiscordSummaryInput = {
      ...baseInput,
      challenge: { ...baseInput.challenge, status: "COMPLETED" },
      participants: [
        baseInput.participants[0],
        baseInput.participants[1],
        {
          id: "p3",
          displayName: "Charlie",
          username: "charlie_sick",
          teamName: "Honey Bees",
          totalLoggedSeconds: 5000,
          targetSeconds: 36000,
          progressPercent: 14,
          rank: 3,
          completedGoalsCount: 0,
          totalGoalsCount: 2,
          punishmentEvaluation: {
            isPunished: true,
            hoursDeficitSeconds: 31000,
            incompleteGoals: 2,
          },
          punishmentRecord: {
            isPardoned: true,
            pardonReason: "Flu outbreak",
          },
        },
      ],
    };

    const markdown = generateDiscordSummary(completedInput);

    expect(markdown).toContain("# 🏆 Final Challenge Results: Autumn Café Clash");
    expect(markdown).toContain("**Winning House:** Honey Bees (+3h margin)");
    expect(markdown).toContain("The Accountability Nook (Forfeits):");
    expect(markdown).toContain("**Bob** (@bob_flutter)");
    expect(markdown).toContain("Granted Pardons:");
    expect(markdown).toContain("**Charlie** (@charlie_sick) (Flu outbreak)");
  });

  it("notes zero forfeits when all participants met goals and hours on COMPLETED challenge", () => {
    const perfectInput: DiscordSummaryInput = {
      ...baseInput,
      challenge: { ...baseInput.challenge, status: "COMPLETED" },
      participants: [baseInput.participants[0]],
    };

    const markdown = generateDiscordSummary(perfectInput);
    expect(markdown).toContain("Zero forfeits this round");
  });
});
