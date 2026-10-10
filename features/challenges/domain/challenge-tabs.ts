/**
 * Pure domain definitions and validation for Challenge View tabs.
 * Adheres strictly to Law L7 (Pure Domain Isolation).
 */

export const CHALLENGE_TABS = [
   "overview",
   "leaderboard",
   "manage",
   "audit",
] as const;

export type ChallengeTab = (typeof CHALLENGE_TABS)[number];

export const PUBLIC_CHALLENGE_TABS: readonly ChallengeTab[] = [
   "overview",
   "leaderboard",
];

export const ADMIN_CHALLENGE_TABS: readonly ChallengeTab[] = [
   "manage",
   "audit",
];

export const DEFAULT_CHALLENGE_TAB: ChallengeTab = "overview";

/**
 * Checks whether an arbitrary value is a recognized ChallengeTab.
 */
export function isChallengeTab(tab: unknown): tab is ChallengeTab {
   return (
      typeof tab === "string" &&
      (CHALLENGE_TABS as readonly string[]).includes(tab)
   );
}

/**
 * Resolves the effective accessible ChallengeTab based on user permissions.
 * Gracefully redirects legacy "about" tab to "overview".
 * Falls back to DEFAULT_CHALLENGE_TAB ("overview") if invalid or unauthorized.
 */
export function resolveAllowedChallengeTab(
   requestedTab: unknown,
   isAdmin: boolean
): ChallengeTab {
   if (requestedTab === "about") {
      return DEFAULT_CHALLENGE_TAB;
   }

   if (!isChallengeTab(requestedTab)) {
      return DEFAULT_CHALLENGE_TAB;
   }

   if (ADMIN_CHALLENGE_TABS.includes(requestedTab) && !isAdmin) {
      return DEFAULT_CHALLENGE_TAB;
   }

   return requestedTab;
}
