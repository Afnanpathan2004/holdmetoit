import { describe, expect, it } from "vitest";

import {
  assertCanKickoffChallenge,
  assertCanLockChallenge,
  canKickoffChallenge,
  canLockChallenge,
  validateChallengeCreation,
  ChallengeStateError,
} from "./challenge-lifecycle";

describe("challenge lifecycle domain (FEAT-CHAL-02, FEAT-CHAL-05)", () => {
  describe("canKickoffChallenge & assertCanKickoffChallenge", () => {
    it("permits kickoff when status is UPCOMING", () => {
      expect(canKickoffChallenge("UPCOMING")).toBe(true);
      expect(() => assertCanKickoffChallenge("UPCOMING")).not.toThrow();
    });

    it("rejects kickoff when already ACTIVE", () => {
      expect(canKickoffChallenge("ACTIVE")).toBe(false);
      expect(() => assertCanKickoffChallenge("ACTIVE")).toThrowError(
        ChallengeStateError,
      );
    });

    it("rejects kickoff when COMPLETED", () => {
      expect(canKickoffChallenge("COMPLETED")).toBe(false);
      expect(() => assertCanKickoffChallenge("COMPLETED")).toThrowError(
        ChallengeStateError,
      );
    });
  });

  describe("canLockChallenge & assertCanLockChallenge", () => {
    it("permits locking final results when status is ACTIVE", () => {
      expect(canLockChallenge("ACTIVE")).toBe(true);
      expect(() => assertCanLockChallenge("ACTIVE")).not.toThrow();
    });

    it("rejects locking when UPCOMING", () => {
      expect(canLockChallenge("UPCOMING")).toBe(false);
      expect(() => assertCanLockChallenge("UPCOMING")).toThrowError(
        ChallengeStateError,
      );
    });

    it("rejects locking when already COMPLETED", () => {
      expect(canLockChallenge("COMPLETED")).toBe(false);
      expect(() => assertCanLockChallenge("COMPLETED")).toThrowError(
        ChallengeStateError,
      );
    });
  });

  describe("validateChallengeCreation", () => {
    it("validates valid TEAM_VS_TEAM input", () => {
      const result = validateChallengeCreation({
        title: "Midterm Study Battle",
        format: "TEAM_VS_TEAM",
        startAt: new Date("2026-09-01T08:00:00Z"),
        endAt: new Date("2026-09-08T08:00:00Z"),
        teams: [
          { name: "Honey Bees", color: "#d9822b", iconEmoji: "🐝" },
          { name: "Lavender Butterflies", color: "#9986b8", iconEmoji: "🦋" },
        ],
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("rejects short or empty titles", () => {
      const result = validateChallengeCreation({
        title: "Hi",
        format: "DUOS",
        startAt: new Date("2026-09-01T08:00:00Z"),
        endAt: new Date("2026-09-08T08:00:00Z"),
        teams: [{ name: "Pair 1" }],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.title).toBe("Challenge title must be at least 3 characters.");
    });

    it("rejects end date before or equal to start date", () => {
      const result = validateChallengeCreation({
        title: "Invalid Dates Battle",
        format: "SOLOS",
        startAt: new Date("2026-09-08T08:00:00Z"),
        endAt: new Date("2026-09-01T08:00:00Z"),
        teams: [{ name: "Solo Grinders" }],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.endAt).toBe("End time must be after start time.");
    });

    it("rejects TEAM_VS_TEAM with fewer than 2 teams", () => {
      const result = validateChallengeCreation({
        title: "One Team Battle",
        format: "TEAM_VS_TEAM",
        startAt: new Date("2026-09-01T08:00:00Z"),
        endAt: new Date("2026-09-08T08:00:00Z"),
        teams: [{ name: "Only Team" }],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.teams).toBe(
        "Team vs Team format requires at least 2 competing teams.",
      );
    });

    it("rejects duplicate team names", () => {
      const result = validateChallengeCreation({
        title: "Duplicate Teams",
        format: "TEAM_VS_TEAM",
        startAt: new Date("2026-09-01T08:00:00Z"),
        endAt: new Date("2026-09-08T08:00:00Z"),
        teams: [{ name: "Bees" }, { name: "bees" }],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.teams).toBe(
        "Team names must be unique within the challenge.",
      );
    });
  });
});
