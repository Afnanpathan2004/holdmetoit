import { describe, expect, it } from "vitest";

import {
  assertChallengeTransition,
  assertKickoffPrerequisites,
  canCompleteChallenge,
  canStartChallenge,
  InvalidLifecycleTransitionError,
  LifecyclePrerequisiteError,
} from "./lifecycle";

describe("challenge lifecycle domain", () => {
  describe("canStartChallenge", () => {
    it("returns true only for UPCOMING", () => {
      expect(canStartChallenge("UPCOMING")).toBe(true);
      expect(canStartChallenge("ACTIVE")).toBe(false);
      expect(canStartChallenge("COMPLETED")).toBe(false);
    });
  });

  describe("canCompleteChallenge", () => {
    it("returns true only for ACTIVE", () => {
      expect(canCompleteChallenge("ACTIVE")).toBe(true);
      expect(canCompleteChallenge("UPCOMING")).toBe(false);
      expect(canCompleteChallenge("COMPLETED")).toBe(false);
    });
  });

  describe("assertChallengeTransition", () => {
    it("allows UPCOMING -> ACTIVE", () => {
      expect(() => assertChallengeTransition("UPCOMING", "ACTIVE")).not.toThrow();
    });

    it("allows ACTIVE -> COMPLETED", () => {
      expect(() => assertChallengeTransition("ACTIVE", "COMPLETED")).not.toThrow();
    });

    it("rejects transition to same status", () => {
      expect(() => assertChallengeTransition("UPCOMING", "UPCOMING")).toThrow(
        InvalidLifecycleTransitionError,
      );
      expect(() => assertChallengeTransition("ACTIVE", "ACTIVE")).toThrow(
        InvalidLifecycleTransitionError,
      );
      expect(() => assertChallengeTransition("COMPLETED", "COMPLETED")).toThrow(
        InvalidLifecycleTransitionError,
      );
    });

    it("rejects backwards transitions", () => {
      expect(() => assertChallengeTransition("COMPLETED", "ACTIVE")).toThrow(
        InvalidLifecycleTransitionError,
      );
      expect(() => assertChallengeTransition("COMPLETED", "UPCOMING")).toThrow(
        InvalidLifecycleTransitionError,
      );
      expect(() => assertChallengeTransition("ACTIVE", "UPCOMING")).toThrow(
        InvalidLifecycleTransitionError,
      );
    });

    it("rejects skipping lifecycle states (UPCOMING -> COMPLETED)", () => {
      expect(() => assertChallengeTransition("UPCOMING", "COMPLETED")).toThrow(
        InvalidLifecycleTransitionError,
      );
    });
  });

  describe("assertKickoffPrerequisites", () => {
    it("passes when teams and participants are present", () => {
      expect(() =>
        assertKickoffPrerequisites({ teamsCount: 2, participantsCount: 4 }),
      ).not.toThrow();
    });

    it("throws when teams count is zero", () => {
      expect(() =>
        assertKickoffPrerequisites({ teamsCount: 0, participantsCount: 4 }),
      ).toThrow(LifecyclePrerequisiteError);
    });

    it("throws when participants count is zero", () => {
      expect(() =>
        assertKickoffPrerequisites({ teamsCount: 2, participantsCount: 0 }),
      ).toThrow(LifecyclePrerequisiteError);
    });
  });
});

