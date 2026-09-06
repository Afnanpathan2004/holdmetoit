import { describe, expect, it } from "vitest";

import {
  areDeclarationsLocked,
  canEditDeclarations,
  canLogStudyTime,
  canToggleGoalCompletion,
  isChallengeReadOnly,
} from "@/features/declarations/domain/declaration-lock";

describe("declaration lock rules", () => {
  it("allows declaration edits only before kickoff", () => {
    expect(canEditDeclarations("UPCOMING")).toBe(true);
    expect(canEditDeclarations("ACTIVE")).toBe(false);
    expect(canEditDeclarations("COMPLETED")).toBe(false);
    expect(areDeclarationsLocked("ACTIVE")).toBe(true);
  });

  it("allows study logging only during active challenges", () => {
    expect(canLogStudyTime("UPCOMING")).toBe(false);
    expect(canLogStudyTime("ACTIVE")).toBe(true);
    expect(canLogStudyTime("COMPLETED")).toBe(false);
  });

  it("allows goal completion toggles only during active challenges", () => {
    expect(canToggleGoalCompletion("UPCOMING")).toBe(false);
    expect(canToggleGoalCompletion("ACTIVE")).toBe(true);
    expect(canToggleGoalCompletion("COMPLETED")).toBe(false);
  });

  it("marks completed challenges as read-only", () => {
    expect(isChallengeReadOnly("COMPLETED")).toBe(true);
    expect(isChallengeReadOnly("ACTIVE")).toBe(false);
  });
});
