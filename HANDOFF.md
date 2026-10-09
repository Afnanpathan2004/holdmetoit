# HANDOFF.md — Engineering Operational Relay & Milestone Tracker

> **Project:** HoldMeToIt (Gamified Study Accountability & Challenge Management Platform)  
> **Repository:** `github.com/Afnanpathan2004/holdmetoit`  
> **Integration Branch:** `main` (latest: `c174a58`, PR #12) · Personal branches: `krish`, `afnan`, `afnan-jr`, `dev`  
> **Document Status:** Active Operational Relay (Living Document)  
> **Last Updated:** 2026-10-09 (Session 73 — merge afnan-jr into dev: tab URL sync, team colors & side-by-side layout)  
> **Governance:** Subject to strict **Handoff Pruning & Obsolescence Rule (§9.3 in `AGENTS.md`)**

---

## 1. Current State at a Glance

| Gate                                         | Result (2026-10-09, branch `dev`)                                                                                                                                                                                                                                     |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                          | ✅ 0 errors (`npx tsc --noEmit`)                                                                                                                                                                                                                                      |
| `npm run test`                               | ✅ 74 files green (758/758 tests passing)                                                                                                                                                                                                                             |
| `npm run build`                              | ✅ 10 routes compiled (9 app routes + `_not-found`)                                                                                                                                                                                                                   |
| Phase 0 feature parity (vs `FEATURES.md`)    | ⚠️ **~89%** — Dedicated public /challenges catalog with status & format filters, challenge-specific participant statistics cockpit, multi-view search & team filtering with View by Team mode, multi-view pagination guards, mod audit log & hours overrides complete |
| Phase 0 Milestone Gate 1 (`ROADMAP.md` §3.4) | ❌ Not passed: no live pilot challenge has run; Vercel deployment not recorded in the repo                                                                                                                                                                            |
| Phase 1 (P1)                                 | ⏸️ Not started                                                                                                                                                                                                                                                        |

### 1.1 Live Routes

| Route                                         | Purpose                                                                                        | Access                                 |
| :-------------------------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------- |
| `/`                                           | Home cockpit: banner variants, progress/deficit card, Log Hours modal, Daily/Weekly task board | Guest (local tasks only) / Participant |
| `/challenges`                                 | Dedicated public challenges directory (Events card grid, role-gated Create Challenge button)   | Public spectator / Participant / Admin |
| `/challenge/[id]`                             | Tabs: Overview · Leaderboard · About · Manage (admin only)                                     | Public spectator                       |
| `/challenge/[id]/participant/[participantId]` | Challenge-specific participant statistics, targets, daily history & read-only profile          | Public spectator / Participant / Admin |
| `/challenge/[id]/manual`                      | Manual weekly slot-hours leaderboard (host-entered)                                            | Public view, admin entry               |
| `/admin`                                      | Server redirect to `/challenges`                                                               | `ADMIN` / `DEV`                        |
| `/admin/challenges/new`                       | Challenge creator wizard (2 required image uploads)                                            | `ADMIN` / `DEV`                        |
| `POST /api/feedback`                          | Bug/suggestion intake → DB + Discord embed                                                     | Anyone                                 |
| `POST /api/tasks/sync`                        | Offline task queue batch sync                                                                  | Authenticated                          |

> **Removed routes:** `/dashboard` (replaced by `/`) and `/admin/challenges/[id]/roster` (replaced by the Manage tab). Several `revalidatePath("/dashboard")` calls remain and do nothing; they're harmless but should be cleaned up.

### 1.2 RBAC Model

- `DEV` → Discord snowflake listed in `DEV_DISCORD_IDS` (JSON array; legacy alias `DISCORD_DEV_IDS` still read).
- `ADMIN` → user holds a role in `DISCORD_ADMIN_ROLE_IDS` within `DISCORD_GUILD_ID` (looked up with `DISCORD_BOT_TOKEN`; OAuth scope stays `identify`).
- `PARTICIPANT` → everyone else. The `DISCORD_ADMIN_IDS` whitelist has been removed.
- **Global Participant Preview:** Admins and devs can toggle a global cookie (`holdmetoit_preview_as_participant`) from the header next to "Admin Console". When active, all pages (`/`, `/challenge/[id]`, etc.) render exactly as regular participants see them (hiding Manage tab, Event Audit tab, host override controls, and DEV badge).

---

## 2. Phase 0 (MVP Core) Feature Status Matrix — Verified Against Code

Legend: ✅ Done end-to-end · ⚠️ Partial / backend-only / deviates from spec · ❌ Missing

| Feature ID      | Feature                            | Status | Evidence / Gap                                                                                                                                                                                                                         |
| :-------------- | :--------------------------------- | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FEAT-AUTH-01`  | Discord OAuth (`identify`)         |   ✅   | `core/auth/index.ts`; role synced on sign-in via `syncUserRoleFromDiscord`                                                                                                                                                             |
| `FEAT-AUTH-02`  | Public spectator mode              |   ✅   | `app/challenge/[id]/page.tsx` renders without a session                                                                                                                                                                                |
| `FEAT-CHAL-01`  | Multi-format challenge creator     |   ✅   | `/admin/challenges/new`; banner + PFP uploads go to Supabase Storage                                                                                                                                                                   |
| `FEAT-CHAL-02`  | Host manual kickoff                |   ✅   | Manage tab → `kickoffChallengeAction` (sets `startAt = now`; status is derived from timestamps)                                                                                                                                        |
| `FEAT-CHAL-05`  | Lock final results                 |   ⚠️   | Manage tab → `lockChallengeResultsAction`. **Bug:** once `endAt` passes on its own, status becomes `COMPLETED` and `assertCanLockChallenge` throws, so punishments are **never evaluated** unless the host locks _before_ the end time |
| `FEAT-CHAL-06`  | Duo partner self-naming            |   ❌   | No participant-side duo naming code exists. Only hosts can rename teams (Manage tab → Team Identities)                                                                                                                                 |
| `FEAT-AUDIT-01` | Append-only audit trail            |   ⚠️   | `features/audit/data/audit-log.repository.ts` stores events in PostgreSQL (`audit_logs`) and in-memory fallback. Event Audit tab UI live in `/challenge/[id]`.                                                                         |
| `FEAT-DECL-01`  | Declared target hours (`HH:MM:SS`) |   ✅   | Entered in the enrollment modal (1–105h). Note: `leaveDays` is accepted by the action but **silently discarded** (no column)                                                                                                           |
| `FEAT-DECL-02`  | Mandatory weekly goals checklist   |   ⚠️   | `WeeklyGoal` was dropped (migration `20261004030000`). It was replaced by **user-scoped** Daily/Weekly categorized tasks (`features/tasks/`) that are **not linked to any challenge**                                                  |
| `FEAT-DECL-03`  | Declaration lock on `ACTIVE`       |   ✅   | Targets can't be edited after enrollment at all. Late enrollment is still allowed while `ACTIVE` (only `COMPLETED` blocks it)                                                                                                          |
| `FEAT-DECL-04`  | Host goal/target edit              |   ❌   | No goals exist to edit, and `updateParticipantTargetSeconds` has no callers                                                                                                                                                            |
| `FEAT-LOG-01`   | Daily `HH:MM:SS` self-logging      |   ✅   | `daily-hours-modal.tsx`: participants restricted to today/yesterday self-logging (`ONLY_TODAY_OR_YESTERDAY_ALLOWED`), non-scrolling 7-day selector, native picker (`max=today`), domain guards                                         |
| `FEAT-LOG-02`   | 24h single-day limit               |   ✅   | `MAX_DAILY_LOG_SECONDS` in `daily-log.validation.ts`                                                                                                                                                                                   |
| `FEAT-LOG-04`   | Admin inline hours override UI     |   ✅   | `AdminHoursOverrideModal`: mods and devs (`ADMIN`, `DEV`) can override any participant's hours for any day of the week (D1..D7) with mandatory audit reason; integrated into Manage tab roster & Leaderboard tab                       |
| `FEAT-LEAD-01`  | Head-to-head scoreboard            |   ✅   | `challenge-leaderboard-tab.tsx`: matchup card with share % and team targets                                                                                                                                                            |
| `FEAT-LEAD-02`  | Unified standings table            |   ✅   | Desktop table plus mobile card layout. No "Goals Done" column (goals no longer exist)                                                                                                                                                  |
| `FEAT-LEAD-03`  | Catch-up deficit engine            |   ✅   | `deficit.ts` + `cockpit-progress-card.tsx`                                                                                                                                                                                             |
| `FEAT-PUN-01`   | Dual-failure auto-flagging         |   ⚠️   | `lockChallengeResults` passes `[]` as goals, so **Law L6 runs on hours only**                                                                                                                                                          |
| `FEAT-PUN-02`   | Punishment Wall                    |   ❌   | `punishment-wall.tsx` was deleted in `88779bd`. The Overview tab only mentions it in copy                                                                                                                                              |
| `FEAT-PUN-03`   | Punishment PFP download button     |   ❌   | PFP upload works; there's no download button anywhere in the UI                                                                                                                                                                        |
| `FEAT-PUN-04`   | Host pardon                        |   ⚠️   | `adminPardonAction` exists; **no UI** (`admin-goals-pardons.tsx` was deleted in `364c7a1`)                                                                                                                                             |
| `FEAT-DISC-01`  | 1-click Discord summary copy       |   ⚠️   | `generateDiscordSummary()` is a pure domain function; **no UI** (`discord-summary-card.tsx` was deleted in `364c7a1`)                                                                                                                  |

### 2.1 Shipped Beyond the Original P0 Spec

| Capability                                            | Location                                                     | Notes                                                                                               |
| :---------------------------------------------------- | :----------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| Categorized Daily/Weekly to-do board with drag & drop | `features/tasks/`, `cockpit-tasks-section.tsx`               | Offline-first IndexedDB (`holdmetoit_db`), debounced background sync, guest→user migration on login |
| Global Participant Preview Mode                       | `features/auth/presentation/auth-nav.tsx`, `preview-mode.ts` | 1-click header toggle for mods/devs to view all pages as regular participants globally              |
| Feedback & bug reporting                              | `features/feedback/`, `app/api/feedback/route.ts`            | Floating trigger button, `FB-XX` codes, Discord bot embeds, LogRocket session link                  |
| LogRocket observability                               | `core/observability/`                                        | Session replay, `error.tsx` / `global-error.tsx` boundaries                                         |
| Manual weekly slot leaderboard                        | `features/leaderboard/*manual*`, `/challenge/[id]/manual`    | ⚠️ Stores `sessionHours` as `Decimal(6,2)`, which violates **Law L8** (integer seconds)             |
| Dynamic cockpit banner (7 variants) & hero banner     | `cockpit-banner.ts`, `challenge-hero-banner.tsx`             | Matches the Figma                                                                                   |
| `DEV` role                                            | `auth-roles.ts`, `discord-guild.service.ts`                  | Grants full admin plus developer access                                                             |

---

## 3. Known Defects & Technical Debt (Prioritized)

|  #  | Severity | Issue                                                                                                                                                                                                                          | Suggested Fix                                                                                                                                                                     |
| :-: | :------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | 🔴 High  | Lock Results fails after natural expiry, so punishments are never evaluated (`assertCanLockChallenge` rejects `COMPLETED`)                                                                                                     | Allow lock/evaluate when status is `COMPLETED` and the challenge hasn't been finalized yet. That needs a persisted `finalizedAt` (or `resultsLockedAt`) column to stay idempotent |
| D2  | 🔴 High  | Audit trail in-memory fallback needs full persistence validation                                                                                                                                                               | Add migration check and verify Prisma `audit_logs` model insertion across all environments                                                                                        |
| D3  | 🔴 High  | Five P0 features have backend code but no UI: override grid, pardon, Discord summary copy, Punishment Wall, PFP download                                                                                                       | Rebuild them in Obsidian styling inside the Manage tab (admin) and the Overview tab (public wall + download)                                                                      |
| D4  |  🟠 Med  | Law L6 runs on hours only: goals aren't challenge-scoped any more                                                                                                                                                              | **Product decision needed** (see §4)                                                                                                                                              |
| D5  |  🟠 Med  | Schema drift: the `feedbacks` table and the `sort_order` columns on `categories`/`tasks` were applied with `db push` and have **no migration files**. `prisma migrate deploy` on a fresh DB would produce an incomplete schema | Generate catch-up migrations (`prisma migrate diff`) and `migrate resolve` them on existing DBs                                                                                   |
| D6  |  🟡 Low  | `leaveDays` is collected in the enrollment modal and then discarded                                                                                                                                                            | Either persist it and feed it into the deficit/target math, or remove it from the UI                                                                                              |
| D7  |  🟡 Low  | Manual leaderboard uses `Decimal` hours (Law L8 deviation)                                                                                                                                                                     | Migrate to integer `sessionSeconds`                                                                                                                                               |
| D8  |  🟡 Low  | Stale `revalidatePath("/dashboard")` calls; `DISCORD_DEV_IDS` alias; `DEFAULT_FEEDBACK_CHANNEL_ID` hardcoded                                                                                                                   | Clean up                                                                                                                                                                          |
| D9  |  🟡 Low  | "E2E J1–J6" suite (`features/e2e/quality-matrix-j1-j6.test.ts`) mocks Prisma; there's no real browser E2E                                                                                                                      | Add Playwright journeys once the D3 UIs are back                                                                                                                                  |
| D10 |  🟡 Low  | Duplicate lockfiles (`bun.lock` + `package-lock.json`); `npm audit` reports 20 vulns (3 critical)                                                                                                                              | Pick one package manager; run `npm audit` triage                                                                                                                                  |

---

## 4. Open Product Decisions (Require Team Sign-off)

1. **Goals vs Law L6:** Should challenges get a challenge-scoped goal list again (e.g. link Weekly tasks to an enrollment), or should Law L6 be formally amended to hours-only? Until this is decided, `FEAT-DECL-02/04` and `FEAT-PUN-01` stay ⚠️.
2. **Leave days:** Should declared leave days reduce the target or the days remaining in the catch-up math? Law L3 forbids grace passes, so this needs an explicit ruling.
3. **Late enrollment while `ACTIVE`:** Is this intended? It's allowed today.
4. **Design authority:** `DESIGN.md` now documents the Obsidian system (it replaced "Cozy Study Café" on 2026-10-04). Confirm this is ratified.

---

## 5. Foundational Laws — Compliance Snapshot

| Law                        | Status | Note                                                                                             |
| :------------------------- | :----: | :----------------------------------------------------------------------------------------------- |
| L1 Mathematical Unity      |   ✅   | Single `Team` entity with `maxMembers`                                                           |
| L2 Spreadsheet Exorcism    |   ✅   | Full-week admin override UI and auto-aggregating standings eliminate manual arithmetic           |
| L3 Catch-Up Deficit        |   ✅   | `deficit.ts`; no grace passes                                                                    |
| L4 Discord Identity        |   ✅   | OAuth only; public spectator                                                                     |
| L5 Admin Override Absolute |   ✅   | `adminOverrideStudyHoursAction` + `AdminHoursOverrideModal` live in Manage tab & Leaderboard tab |
| L6 Dual-Failure            |   ⚠️   | Hours-only (D4)                                                                                  |
| L7 Pure Domain Isolation   |   ✅   | `domain/` folders are framework-free                                                             |
| L8 Second-Level Precision  |   ⚠️   | Main logs ✅; manual leaderboard uses `Decimal` hours (D7)                                       |
| L9 Zero-State Resilience   |   ✅   | `loading.tsx` on all routes; `EmptyState` / `ErrorState` components                              |

---

## 6. Immediate Next Step (For Incoming Agent)

> [!IMPORTANT]
> **EXACT NEXT STEP:** Fix **D1 + D2** together as one vertical slice (`fix/challenge-finalization`):
>
> 1. Add `Challenge.resultsLockedAt DateTime?` to `prisma/schema.prisma` and create a migration.
> 2. Ensure `audit-log.repository.ts` persists all audit entries into the `AuditLog` table using Prisma.
> 3. Let `lockChallengeResults` run when status is `ACTIVE` **or** (`COMPLETED` and `resultsLockedAt IS NULL`); set `resultsLockedAt` inside the transaction.
> 4. Update the lifecycle and lock unit tests, then run typecheck, test, and build.
>
> Then restore the remaining P0 UIs (Punishment Wall + PFP download on the Overview tab; pardon modal and Discord summary copy in the Manage tab).

---

## 7. Session Changelog (Last 3–5 Sessions)

### Sessions 1–66 (Summarized)

- Core domain math, Prisma models, Discord OAuth, participant cockpit, mobile pass, drag & drop across Daily/Weekly boards, offline-first IndexedDB task sync (`holdmetoit_db`), 2-card participant logging, admin 7-day hours overrides, law labels UI cleanup, moderator future hours prevention, past challenge day task-adding guards, cross-day task moving/rescheduling with validation, participant study log audit trail integration (`STUDY_LOG_ADDED`), and dedicated public challenges catalog (`/challenges`) with role-gated admin controls.

### Session 67 — 2026-10-09 (krish)

- **Agent Role:** Participant UI & Scoring / Engine Agent.
- **Multi-View Pagination & Overflow Guards Across Platform:**
   - Created reusable Obsidian Dark `DataPagination` component (`components/ui/data-pagination.tsx`):
      - Responsive: Mobile compact indicator (`Page X of Y` / `X–Y of Z`) and desktop numbered pills with smart ellipsis for large page ranges (`1, 2, ..., 10`).
      - Compact variant for narrow cards and sidebars.
      - Auto-hides gracefully when `totalPages <= 1`.
      - Comprehensive unit test suite in `data-pagination.test.tsx` (4/4 tests green).
   - Leaderboard standings (`challenge-leaderboard-tab.tsx`), participant overview roster (`challenge-overview-tab.tsx`), event audit log (`event-audit-tab.tsx`), admin roster (`challenge-manage-tab.tsx`), public challenges grid (`challenges-list-view.tsx`), and manual leaderboard (`manual-leaderboard-view.tsx`) all paginated and protected against layout overflows.
- **Quality Gates:** `npx tsc --noEmit` ✅ (0 errors) · `npm run test` ✅ (all tests green) · `npx next build` ✅.

### Session 68 — 2026-10-09 (afnan)

- **Agent Role:** Participant UI & Scoring / Engine Agent.
- **Challenge-Specific Participant Statistics & Read-Only Profiles (`FEAT-LEAD-06`):**
   - **Dedicated Route (`/challenge/[id]/participant/[participantId]`):** dynamic server-rendered page and skeleton loader. Cross-challenge validation returns empty state if mismatched.
   - **Pure Domain Calculations (`features/participant-stats/domain/`):** chronological timeline with zero-hour rest days, summary stats, team contribution meter, and deficit accountability.
   - **Repository & Presentation Layers:** joined scoreboard rank, profile header with breadcrumbs, Obsidian summary cards, responsive SVG/HTML daily bar chart, daily history table/cards.
   - Clickable participant names/avatars across Leaderboard tab, Overview tab, and Admin Roster.
- **Quality Gates:** `npm run typecheck` ✅ (0 errors) · `npm run test` ✅ (70 files, 709/709 green) · `npm run build` ✅.

### Session 69 — 2026-10-09 (afnan)

- **Agent Role:** Participant UI & Scoring / Engine Agent.
- **Bug Fix — House Standing Participant Rank (`FEAT-LEAD-06`):**
   - Corrected "House Standing" card in `ParticipantTeamStats` to calculate and display participant's rank within their own team (`participantTeamRank`) rather than the overall team standing.
- **Quality Gates:** `npm run typecheck` ✅ (0 errors) · `npm run test` ✅ (70 files, 709/709 green).

### Session 70 — 2026-10-09 (krish)

- **Agent Role:** Participant UI & Scoring / Engine Agent.
- **Multi-View Search, Filtering & "View by Team" Mode Across Data Lists:**
   - **Leaderboard Tab (`challenge-leaderboard-tab.tsx`):**
      - Instant text search across display name, `@username`, and team/house name with live match counts.
      - House/Team filter dropdown (`All Teams`, individual teams with icons, name, and member counts).
      - Pace/Status filter dropdown (`All Pace Statuses`, `On Track / Ahead`, `Catch-Up / Behind`).
      - High-level View Mode toggle: **`Overall Rank`** vs **`View by Team`**.
      - In **`View by Team`** mode: Renders distinct house cards grouping enrolled scholars by competing house, featuring house emoji, name, leader badge, house logged clock vs house target clock, visual progress bar, and intra-house scholar rankings (`#1 in House (#X Overall)`), avatars, today's hours, total hours, pace badges, and admin hour overrides.
      - Active filter badge pills with 1-click dismissal and styled empty filter state with reset action.
   - **Overview Tab Enrolled Roster (`challenge-overview-tab.tsx`):**
      - Added instant text search and House/Team filter dropdown with active filter count and reset button.
   - **Manage Tab Admin Roster Grid (`challenge-manage-tab.tsx`):**
      - Added House filter dropdown (`All Houses`, individual houses, `Unassigned Scholars`) with counter badge (`X of Y scholars`) and reset controls beside the existing roster search.
   - **Public Challenges Directory Grid (`challenges-list-view.tsx`):**
      - Added instant text search across challenge title, format, host name/username, and participating team names.
      - Added status filter tabs (`All`, `Active`, `Upcoming`, `Completed`) with real-time challenge counts.
      - Added format filter dropdown (`All Formats`, `Team vs Team`, `Solo Battles`, `Duo Battles`, `Squad Battles`).
      - Styled empty filter state with 1-click filter reset.
   - **Manual Leaderboard Standings (`manual-leaderboard-view.tsx`):**
      - Added search input and team filter dropdown for manual slot standings with empty state reset.
   - **Test Suite Updates:**
      - Added unit and interaction tests across `challenge-leaderboard-tab.test.tsx`, `challenge-overview-tab.test.tsx`, `challenges-list-view.test.tsx`, and created `manual-leaderboard-view.test.tsx`.
- **Quality Gates:** `npm run typecheck` ✅ (0 errors) · `npm run test` ✅ (71 files, 713/713 green) · `npm run build` ✅ (10 routes compiled successfully).

### Session 71 — 2026-10-09 (afnan-jr)

- **Agent Role:** Scoring & Engine Agent & Data / Identity Agent.
- **Dynamic Single-Hex Team Colors, Hardening & Dual-Layer 5-Minute Caching Engine:**
   - **Pure Domain Color Engine (`features/challenges/domain/team-colors.ts`):**
      - Pure TypeScript functional engine adhering to **Law L7** (zero React/Next.js/ORM dependencies).
      - Converts hex into RGB and HSL space; `getReadableTextColor(hex)` locks Hue and Saturation and lifts Lightness ($L \ge 76\%$) for WCAG AA contrast ($>6.5:1$) on Obsidian dark surfaces (`#0d0d0d` / `#141414`).
      - Generates complete 10-token dark palette (`palette.solid`, `subtleBg`, `cardBg`, `border`, `subtleBorder`, `text`, `glow`, `hoverBorder`, `headerBg`, `avatarBg`).
      - Pitch-black `#000000` luminance guard and CSS 4-character `#rgba` shorthand support.
      - In-memory 5-minute TTL palette cache (`clearTeamColorCache()`).
   - **ViewModel & Presentation Layer Migration:**
      - Team A & Team B cards, Tug-of-War Split Share Bar, Rank 1 podium card, mobile cards, desktop table rows, and overview roster dynamically adopt admin-configured team hex values.
   - **Server-Side 5-Minute Data Caching (`leaderboard-data.ts`) & Admin Instant Invalidation:**
      - Cached scoreboard uses `revalidate: 300` (5 minutes) with instant admin tag invalidation (`invalidateTags`).
   - **Unit Tests:** 20 unit tests in `team-colors.test.ts` (100% green).
- **Quality Gates:** `npm run typecheck` ✅ (0 errors) · `npm run test` ✅ (71 files, 730/730 green) · `npm run build` ✅ (10 routes compiled successfully).

### Session 72 — 2026-10-09 (krish)

- **Agent Role:** Participant UI & Scoring / Engine Agent.
- **Side-by-Side "View by Team" Responsive Grid Layout:**
   - **Side-by-Side Teams Layout (`challenge-leaderboard-tab.tsx`):**
      - Upgraded the "View by Team" section from a stacked vertical list to a responsive 2-column grid (`grid grid-cols-1 lg:grid-cols-2 gap-6 items-start`) whenever multiple teams exist.
      - On desktop / laptop viewports (`lg: 1024px+`), competing houses are presented side-by-side, utilizing horizontal screen real estate effectively.
      - Preserved full responsiveness: mobile viewports (< 1024px, 360px+) gracefully render in a single column without horizontal overflow or clipped text.
      - Applied `items-start` so competing houses with different roster sizes keep their natural card height without empty stretched bottom areas.
      - Added dynamic column adjustment: when filtered to a single house via dropdown, the card cleanly takes full width (`grid-cols-1`).
      - Fine-tuned intra-card scholar rows and summary headers: flex-wrap badges, compact progress bars (`w-20 sm:w-28`), and responsive width caps.
      - Added `initialViewMode` prop support (`"individual"` | `"team"`) for deep linking and robust SSR unit testing.
   - **Test Suite Updates (`challenge-leaderboard-tab.test.tsx`):**
      - Added unit tests verifying side-by-side grid rendering (`lg:grid-cols-2`) when multiple teams exist in team view mode, and single column fallback when only one team exists.
- **Quality Gates:** `npm run typecheck` ✅ (0 errors) · `npm run test` ✅ (71 files, 715/715 green) · `npm run build` ✅ (10 routes compiled successfully).

### Session 73 — 2026-10-09 (afnan-jr)

- **Agent Role:** Participant UI Agent & Scoring / Engine Agent.
- **Bug Fix — Challenge View Tab Reload Reset & URL Sync (`BUG-CHAL-01`):**
   - **Problem:** Reloading `/challenge/[id]` always reset the view back to the initial entry tab (e.g. `?tab=leaderboard` from cockpit banner card) because tab switches in `<ChallengeView>` only modified internal React state without synchronizing with browser address bar.
   - **Pure Domain Tab Layer (`features/challenges/domain/challenge-tabs.ts`):**
      - Pure TypeScript module isolated from UI/Next.js/ORM per **Law L7**.
      - Exported `CHALLENGE_TABS = ["overview", "leaderboard", "about", "manage", "audit"]`, `PUBLIC_CHALLENGE_TABS`, `ADMIN_CHALLENGE_TABS`, `DEFAULT_CHALLENGE_TAB = "overview"`.
      - Exported pure validation helpers `isChallengeTab` and `resolveAllowedChallengeTab(requestedTab, isAdmin)` which strictly clamps unauthorized admin tabs (`manage`, `audit`) to `"overview"` for non-admins.
      - 9 unit tests in `challenge-tabs.test.ts` (100% green).
   - **Server-Side Page Sanitization (`app/challenge/[id]/page.tsx`):**
      - Sanitized `searchParams?.tab` using `resolveAllowedChallengeTab(searchParams?.tab, isAdmin)` prior to rendering `<ChallengeView>`.
      - 7 unit tests in `app/challenge/[id]/page.test.tsx` (100% green).
   - **Client Presentation Layer (`features/challenges/presentation/challenge-view.tsx`):**
      - **Ratified History Strategy (Option A):** Uses `window.history.replaceState` on tab click; tabs represent views of the same page entity without polluting browser back-button stack.
      - **Query Parameter Preservation:** Preserves all existing query parameters (e.g. `?as=participant`, filters) using `URLSearchParams`.
      - **Canonical Default Cleanup:** Automatically deletes `?tab=overview` to keep canonical URLs clean.
      - Synchronized `activeTab` on `initialTab`/`isAdmin` prop changes using `useEffect`.
      - 12 unit tests in `challenge-view.test.tsx` (100% green).
- **Quality Gates:** `npm run typecheck` ✅ (0 errors) · `npm run test` ✅ (74 files, 758/758 green) · `npm run build` ✅ (10 routes compiled successfully).
- **NEXT STEP:** Fix D1 + D2 (challenge finalization & audit log persistence).
