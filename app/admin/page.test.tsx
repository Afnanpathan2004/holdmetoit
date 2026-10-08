import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AdminDashboardPage from "./page";
import { listAllChallengesForAdmin } from "@/features/challenges/data/challenge-admin.repository";

const imageState = vi.hoisted(() => ({
   status: "loading" as "loading" | "loaded" | "error",
   onLoad: undefined as undefined | (() => void),
   onError: undefined as undefined | (() => void),
}));

vi.mock("react", async (importOriginal) => {
   const actual = await importOriginal<typeof import("react")>();
   return {
      ...actual,
      useState: (initial: unknown) => {
         if (initial === "loading") {
            return [
               imageState.status,
               (status: typeof imageState.status) => {
                  imageState.status = status;
               },
            ];
         }
         return actual.useState(initial);
      },
   };
});

vi.mock("next/image", () => ({
   default: ({
      src,
      alt,
      className,
      onLoad,
      onError,
   }: {
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
   default: ({ href, children }: { href: string; children: ReactNode }) =>
      createElement("a", { href }, children),
}));

vi.mock("@/components/ui/button", () => ({
   Button: ({ children }: { children: ReactNode }) =>
      createElement("div", null, children),
}));

vi.mock("@/features/challenges/data/challenge-admin.repository", () => ({
   listAllChallengesForAdmin: vi.fn(),
}));

const uploadedUrl =
   "https://example.supabase.co/storage/v1/object/public/holdmetoit-bucket/event-banners/banner.png";
const punishmentUrl =
   "https://example.supabase.co/storage/v1/object/public/holdmetoit-bucket/punishment-pfps/pfp.png";

function setChallenge(url: string | null) {
   vi.mocked(listAllChallengesForAdmin).mockResolvedValue([
      {
         id: "challenge-1",
         title: "Study Battle",
         startAt: new Date("2026-10-01T00:00:00.000Z"),
         status: "ACTIVE",
         eventBannerUrl: url,
         punishmentPfpUrl: punishmentUrl,
         _count: { participants: 2 },
      },
   ] as Awaited<ReturnType<typeof listAllChallengesForAdmin>>);
}

async function render() {
   return renderToStaticMarkup(await AdminDashboardPage());
}

beforeEach(() => {
   vi.clearAllMocks();
   imageState.status = "loading";
   imageState.onLoad = undefined;
   imageState.onError = undefined;
});

describe("admin event card images", () => {
   it("renders the event banner rather than the differing punishment PFP", async () => {
      setChallenge(uploadedUrl);
      const html = await render();
      expect(html).toContain(`src="${uploadedUrl}"`);
      expect(html).not.toContain(punishmentUrl);
      expect(html).not.toContain("challenge_hero_battle.jpg");
      expect(html).toContain("Loading image for Study Battle");
      expect(html).toContain('href="/challenge/challenge-1"');
   });

   it("shows the loaded image and removes the skeleton", async () => {
      setChallenge(uploadedUrl);
      await render();
      imageState.onLoad?.();
      const html = await render();
      expect(html).toContain("opacity-80");
      expect(html).not.toContain("Loading image for");
   });

   it.each([null, "", "   "])(
      "uses a neutral background for missing images (%s)",
      async (url) => {
         setChallenge(url);
         const html = await render();
         expect(html).not.toContain("<img");
         expect(html).not.toContain(punishmentUrl);
         expect(html).not.toContain("challenge_hero_battle.jpg");
         expect(html).not.toContain("Loading image for");
         expect(html).toContain("View Challenge");
      }
   );

   it("offers retry for failed images and leaves the challenge link usable", async () => {
      setChallenge(uploadedUrl);
      await render();
      imageState.onError?.();
      const html = await render();
      expect(html).toContain("Image unavailable.");
      expect(html).toContain("Retry image");
      expect(html).not.toContain("<img");
      expect(html).toContain('href="/challenge/challenge-1"');
   });
});
