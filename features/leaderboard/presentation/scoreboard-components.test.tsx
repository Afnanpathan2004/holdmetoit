import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { MatchScoreboardBanner } from "./match-scoreboard-banner";
import { TeamFilterTabs } from "./team-filter-tabs";
import { StandingsTable } from "./standings-table";
import { PunishmentNook } from "./punishment-nook";
import type {
  ScoreboardMatchLead,
  ScoreboardParticipant,
  ScoreboardTeam,
} from "@/features/leaderboard/data/scoreboard.repository";

describe("Scoreboard UI Components", () => {
  const teams: ScoreboardTeam[] = [
    {
      id: "team-bees",
      name: "Honey Bees",
      color: "#ebb06e",
      iconEmoji: "🐝",
      mascotUrl: null,
      sortOrder: 0,
      totalSeconds: 36000,
      memberCount: 2,
    },
    {
      id: "team-butterflies",
      name: "Lavender Butterflies",
      color: "#9986b8",
      iconEmoji: "🦋",
      mascotUrl: null,
      sortOrder: 1,
      totalSeconds: 25200,
      memberCount: 2,
    },
  ];

  const leadMargin: ScoreboardMatchLead = {
    marginSeconds: 10800,
    leader: "a",
    signedMarginSeconds: 10800,
    leadingTeam: teams[0],
    trailingTeam: teams[1],
    isTie: false,
  };

  describe("MatchScoreboardBanner", () => {
    it("renders head-to-head banner with team names, clock times, and leader crown", () => {
      const html = renderToStaticMarkup(
        <MatchScoreboardBanner
          challengeTitle="House Cup Season 1"
          challengeStatus="ACTIVE"
          startAt={new Date("2026-09-01")}
          endAt={new Date("2026-09-08")}
          teams={teams}
          leadMargin={leadMargin}
        />,
      );

      expect(html).toContain("Honey Bees");
      expect(html).toContain("Lavender Butterflies");
      expect(html).toContain("10:00:00"); // 36000s
      expect(html).toContain("07:00:00"); // 25200s
      expect(html).toContain("In Lead");
      expect(html).toContain("+3h ahead"); // 10800s = 3h
      expect(html).toContain("Live Match");
    });

    it("displays tied match cleanly when scores are equal", () => {
      const tiedLeadMargin: ScoreboardMatchLead = {
        marginSeconds: 0,
        leader: "tie",
        signedMarginSeconds: 0,
        leadingTeam: null,
        trailingTeam: null,
        isTie: true,
      };

      const html = renderToStaticMarkup(
        <MatchScoreboardBanner
          challengeTitle="House Cup Season 1"
          challengeStatus="ACTIVE"
          startAt={new Date("2026-09-01")}
          endAt={new Date("2026-09-08")}
          teams={teams}
          leadMargin={tiedLeadMargin}
        />,
      );

      expect(html).toContain("Tied Match");
      expect(html).not.toContain("In Lead");
    });

    it("displays Kickoff Scheduled badge in UPCOMING state", () => {
      const html = renderToStaticMarkup(
        <MatchScoreboardBanner
          challengeTitle="Upcoming Battle"
          challengeStatus="UPCOMING"
          startAt={new Date("2026-09-01T00:00:00Z")}
          endAt={new Date("2026-09-08T00:00:00Z")}
          teams={teams}
          leadMargin={null}
        />,
      );

      expect(html).toContain("Kickoff Scheduled");
    });

    it("declares winner with trophy in COMPLETED state", () => {
      const html = renderToStaticMarkup(
        <MatchScoreboardBanner
          challengeTitle="Completed Battle"
          challengeStatus="COMPLETED"
          startAt={new Date("2026-09-01")}
          endAt={new Date("2026-09-08")}
          teams={teams}
          leadMargin={leadMargin}
        />,
      );

      expect(html).toContain("Final Results");
      expect(html).toContain("Winner");
    });
  });

  describe("TeamFilterTabs", () => {
    it("renders tablist with All tab and each team tab", () => {
      const html = renderToStaticMarkup(
        <TeamFilterTabs
          teams={teams}
          selectedTeamId="all"
          onSelectTeam={() => {}}
          totalParticipantsCount={4}
        />,
      );

      expect(html).toContain('role="tablist"');
      expect(html).toContain("All Houses (4)");
      expect(html).toContain("Honey Bees");
      expect(html).toContain("Lavender Butterflies");
    });
  });

  describe("StandingsTable", () => {
    const participants: ScoreboardParticipant[] = [
      {
        id: "p1",
        userId: "u1",
        username: "alice_bee",
        displayName: "Alice",
        avatarUrl: "https://cdn.example.com/alice.png",
        teamId: "team-bees",
        teamName: "Honey Bees",
        teamColor: "#ebb06e",
        teamIconEmoji: "🐝",
        totalLoggedSeconds: 36000,
        targetSeconds: 36000,
        progressPercent: 100,
        rank: 1,
        isPodium: 1,
        completedGoalsCount: 3,
        totalGoalsCount: 3,
        goals: [{ id: "g1", description: "Goal 1", completed: true }],
        statusBadge: { label: "Target Met", variant: "sage" },
        punishmentEvaluation: {
          isPunished: false,
          reasons: [],
          incompleteGoals: 0,
          hoursDeficitSeconds: 0,
        },
        punishmentRecord: null,
      },
      {
        id: "p2",
        userId: "u2",
        username: "bob_flutter",
        displayName: "Bob",
        avatarUrl: null,
        teamId: "team-butterflies",
        teamName: "Lavender Butterflies",
        teamColor: "#9986b8",
        teamIconEmoji: "🦋",
        totalLoggedSeconds: 18000,
        targetSeconds: 36000,
        progressPercent: 50,
        rank: 2,
        isPodium: 2,
        completedGoalsCount: 1,
        totalGoalsCount: 2,
        goals: [
          { id: "g2", description: "Goal 2", completed: true },
          { id: "g3", description: "Goal 3", completed: false },
        ],
        statusBadge: { label: "At Risk", variant: "terracotta" },
        punishmentEvaluation: {
          isPunished: true,
          reasons: ["hours_deficit", "incomplete_goals"],
          incompleteGoals: 1,
          hoursDeficitSeconds: 18000,
        },
        punishmentRecord: null,
      },
    ];

    it("renders table with participants, podium badges, clocks, and progress", () => {
      const html = renderToStaticMarkup(<StandingsTable participants={participants} />);

      expect(html).toContain("Alice");
      expect(html).toContain("Bob");
      expect(html).toContain("10:00:00");
      expect(html).toContain("05:00:00");
      expect(html).toContain("🥇");
      expect(html).toContain("🥈");
      expect(html).toContain("Target Met");
      expect(html).toContain("At Risk");
    });

    it("renders empty state when participants list is empty", () => {
      const html = renderToStaticMarkup(<StandingsTable participants={[]} />);
      expect(html).toContain("No Participants Found");
    });
  });

  describe("PunishmentNook", () => {
    const punishedParticipant: ScoreboardParticipant = {
      id: "p-punished",
      userId: "u3",
      username: "slacker_sam",
      displayName: "Sam",
      avatarUrl: null,
      teamId: "team-bees",
      teamName: "Honey Bees",
      teamColor: "#ebb06e",
      teamIconEmoji: "🐝",
      totalLoggedSeconds: 10000,
      targetSeconds: 36000,
      progressPercent: 27,
      rank: 3,
      isPodium: 3,
      completedGoalsCount: 0,
      totalGoalsCount: 2,
      goals: [
        { id: "g1", description: "Finish Physics Problem Set", completed: false },
        { id: "g2", description: "Write Literature Review", completed: false },
      ],
      statusBadge: { label: "Forfeit", variant: "terracotta" },
      punishmentEvaluation: {
        isPunished: true,
        reasons: ["hours_deficit", "incomplete_goals"],
        incompleteGoals: 2,
        hoursDeficitSeconds: 26000,
      },
      punishmentRecord: null,
    };

    it("returns null when challenge status is not COMPLETED", () => {
      const htmlActive = renderToStaticMarkup(
        <PunishmentNook
          challengeStatus="ACTIVE"
          punishedParticipants={[punishedParticipant]}
          punishmentPfpUrl="https://cdn.example.com/pfp.jpg"
        />,
      );
      expect(htmlActive).toBe("");

      const htmlUpcoming = renderToStaticMarkup(
        <PunishmentNook
          challengeStatus="UPCOMING"
          punishedParticipants={[punishedParticipant]}
          punishmentPfpUrl="https://cdn.example.com/pfp.jpg"
        />,
      );
      expect(htmlUpcoming).toBe("");
    });

    it("renders serene zero-forfeits card when punishedParticipants is empty", () => {
      const html = renderToStaticMarkup(
        <PunishmentNook
          challengeStatus="COMPLETED"
          punishedParticipants={[]}
          punishmentPfpUrl="https://cdn.example.com/pfp.jpg"
        />,
      );

      expect(html).toContain("All targets met!");
      expect(html).toContain("Zero forfeits this round");
    });

    it("renders punished participant details: hours deficit and unfinished intentions", () => {
      const html = renderToStaticMarkup(
        <PunishmentNook
          challengeStatus="COMPLETED"
          punishedParticipants={[punishedParticipant]}
          punishmentPfpUrl="https://cdn.example.com/pfp.jpg"
        />,
      );

      expect(html).toContain("The Accountability Nook &amp; Forfeits Corner");
      expect(html).toContain("Sam");
      expect(html).toContain("Forfeit");
      expect(html).toContain("Short by");
      expect(html).toContain("Finish Physics Problem Set");
      expect(html).toContain("Write Literature Review");
    });

    it("renders Download Event Avatar button when punishmentPfpUrl is provided", () => {
      const html = renderToStaticMarkup(
        <PunishmentNook
          challengeStatus="COMPLETED"
          punishedParticipants={[punishedParticipant]}
          punishmentPfpUrl="https://cdn.example.com/pfp.jpg"
        />,
      );

      expect(html).toContain("Download Event Avatar (.jpg)");
      expect(html).toContain('href="https://cdn.example.com/pfp.jpg"');
    });

    it("does NOT render Download Event Avatar button when punishmentPfpUrl is null", () => {
      const html = renderToStaticMarkup(
        <PunishmentNook
          challengeStatus="COMPLETED"
          punishedParticipants={[punishedParticipant]}
          punishmentPfpUrl={null}
        />,
      );

      expect(html).not.toContain("Download Event Avatar (.jpg)");
    });
  });
});
