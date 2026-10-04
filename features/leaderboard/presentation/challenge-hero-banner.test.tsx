import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { ChallengeScoreboardViewModel } from "../data/leaderboard-data";
import { ChallengeHeroBanner } from "./challenge-hero-banner";

const imageState = vi.hoisted(() => ({
  status: "loading" as "loading" | "loaded" | "error",
  onLoad: undefined as undefined | (() => void),
  onError: undefined as undefined | (() => void),
}));

// Exercise the image callbacks and their rendered states without adding a DOM dependency.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      if (initial === "loading") {
        return [imageState.status, (status: typeof imageState.status) => {
          imageState.status = status;
        }];
      }
      return actual.useState(initial);
    },
  };
});

vi.mock("next/image", () => ({
  default: ({ src, alt, className, onLoad, onError }: {
    src: string;
    alt: string;
    className: string;
    onLoad: () => void;
    onError: () => void;
  }) => {
    imageState.onLoad = onLoad;
    imageState.onError = onError;
    return createElement("img", { src, alt, className });
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) =>
    createElement("a", { href, className }, children),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: ReactNode }) => createElement("div", null, children),
}));

const uploadedUrl = "https://example.supabase.co/storage/v1/object/public/holdmetoit-bucket/event-banners/banner.png";
const challenge: ChallengeScoreboardViewModel = {
  id: "challenge-1",
  title: "Study Battle",
  heroImageUrl: uploadedUrl,
  eventBannerUrl: uploadedUrl,
  punishmentPfpUrl: uploadedUrl.replace("event-banners", "punishment-pfps"),
  format: "SOLOS",
  status: "ACTIVE",
  startAt: "2026-10-01T00:00:00.000Z",
  endAt: "2026-10-08T00:00:00.000Z",
  daysRemaining: 4,
  totalDays: 7,
  currentDayNumber: 3,
  timeRemainingHuman: "4d",
  teams: [],
  matchHeader: {
    hasMatchup: false,
    teamA: null,
    teamB: null,
    leaderTeamId: null,
    leaderSide: "tie",
    leadMarginSeconds: 0,
    leadMarginClock: "00:00:00",
    leadMarginHuman: "Tied",
    ratioPercentageA: 50,
    ratioPercentageB: 50,
  },
  standings: [],
  punishmentWall: { punishmentPfpUrl: uploadedUrl.replace("event-banners", "punishment-pfps"), flaggedMembers: [], isEventCompleted: false },
  currentUser: { isLoggedIn: false, isEnrolled: false, participantId: null },
};

function render(model = challenge) {
  return renderToStaticMarkup(createElement(ChallengeHeroBanner, { challenge: model }));
}

beforeEach(() => {
  imageState.status = "loading";
  imageState.onLoad = undefined;
  imageState.onError = undefined;
});

describe("ChallengeHeroBanner", () => {
  it("uses the uploaded image rather than the hardcoded battle artwork", () => {
    const html = render();
    expect(html).toContain(`src="${uploadedUrl}"`);
    expect(html).not.toContain("challenge_hero_battle.jpg");
    expect(html).toContain("Loading challenge image");
    expect(html).toContain("Study Battle");
    expect(html).toContain("Enroll Now");
  });

  it("removes the loading skeleton when the image loads", () => {
    render();
    imageState.onLoad?.();
    const html = render();
    expect(html).not.toContain("Loading challenge image");
    expect(html).toContain("opacity-60");
  });

  it("offers retry on an image error while keeping challenge controls usable", () => {
    render();
    imageState.onError?.();
    const html = render();
    expect(html).toContain("Challenge image unavailable.");
    expect(html).toContain("Retry image");
    expect(html).not.toContain(`src="${uploadedUrl}"`);
    expect(html).not.toContain("Loading challenge image");
    expect(html).toContain("Study Battle");
    expect(html).toContain("Enroll Now");
  });

  it("renders a neutral background without a placeholder when no image is saved", () => {
    const html = render({ ...challenge, heroImageUrl: null });
    expect(html).not.toContain("<img");
    expect(html).not.toContain("Loading challenge image");
    expect(html).not.toContain("Retry image");
    expect(html).toContain("bg-gradient-to-br");
    expect(html).toContain("Study Battle");
  });

  it("keys the image subtree by URL so replacements reset loading/error state", () => {
    const replacementUrl = uploadedUrl.replace("banner.png", "replacement.webp");
    const before = ChallengeHeroBanner({ challenge });
    const after = ChallengeHeroBanner({ challenge: { ...challenge, heroImageUrl: replacementUrl } });
    expect(before.props.children[0].key).toBe(uploadedUrl);
    expect(after.props.children[0].key).toBe(replacementUrl);
    expect(after.props.children[0].props.src).toBe(replacementUrl);
  });
});
