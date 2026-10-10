# HANDOFF.md — Engineering Operational Relay & Milestone Tracker

> **Project:** HoldMeToIt (Gamified Study Accountability & Challenge Management Platform)  
> **Repository:** `github.com/Afnanpathan2004/holdmetoit`  
> **Integration Branch:** `main` (latest: `c174a58`, PR #12) · Personal branches: `krish`, `afnan`, `afnan-jr`, `dev`  
> **Last Updated:** 2026-10-10 (Session 78 — Admin Roster Participant Removal)  
> **Governance:** Subject to strict **Handoff Pruning & Obsolescence Rule (§9.3 in `AGENTS.md`)**

---

## 1. Current State at a Glance

| Gate                                         | Result (2026-10-10, branch `afnan-jr`)                                                                                                                                                                                                                                |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                          | ✅ 0 errors (`npx tsc --noEmit`)                                                                                                                                                                                                                                      |
| `npm run test`                               | ✅ 75 files green (794/794 tests passing)                                                                                                                                                                                                                             |
| `npm run build`                              | ✅ 11 routes compiled (production build clean)                                                                                                                                                                                                                        |
| Phase 0 feature parity (vs `FEATURES.md`)    | ⚠️ **~91%** — Dedicated public /challenges catalog with status & format filters, challenge-specific participant statistics cockpit, multi-view search & team filtering with View by Team mode, multi-view pagination guards, mod audit log & hours overrides complete |
| Phase 0 Milestone Gate 1 (`ROADMAP.md` §3.4) | ❌ Not passed: no live pilot challenge has run; Vercel deployment not recorded in the repo                                                                                                                                                                            |
| Phase 1 (P1)                                 | ⏸️ Not started                                                                                                                                                                                                                                                        |

### 1.1 Live Routes

| Route                                         | Purpose                                                                                                | Access                                 |
| :-------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :------------------------------------- |
| `/`                                           | Home cockpit: banner variants, progress/deficit card, Log Hours modal, Daily/Weekly task board         | Guest (local tasks only) / Participant |
| `/challenges`                                 | Dedicated public challenges directory (Events card grid, role-gated Create Challenge button)           | Public spectator / Participant / Admin |
| `/challenge/[id]`                             | Tabs: Overview (includes Timetable & Forfeit Avatar) · Leaderboard · Manage (admin only) · Event Audit | Public spectator                       |
| `/challenge/[id]/participant/[participantId]` | Challenge-specific participant statistics, targets, daily history & read-only profile                  | Public spectator / Participant / Admin |
| `/challenge/[id]/manual`                      | Manual weekly slot-hours leaderboard (host-entered)                                                    | Public view, admin entry               |
| `/admin`                                      | Server redirect to `/challenges`                                                                       | `ADMIN` / `DEV`                        |
| `/admin/challenges/new`                       | Challenge creator wizard (2 required image uploads)                                                    | `ADMIN` / `DEV`                        |
| `POST /api/feedback`                          | Bug/suggestion intake → DB + Discord embed                                                             | Anyone                                 |
| `POST /api/tasks/sync`                        | Offline task queue batch sync                                                                          | Authenticated                          |

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
| `FEAT-PUN-03`   | Punishment PFP download button     |   ✅   | Overview tab contains dedicated Forfeit Avatar & Accountability card with image preview, Law L6 explanation, and direct "Download Forfeit PFP" button                                                                                  |
| `FEAT-PUN-04`   | Host pardon                        |   ⚠️   | `adminPardonAction` exists; **no UI** (`admin-goals-pardons.tsx` was deleted in `364c7a1`)                                                                                                                                             |
| `FEAT-DISC-01`  | 1-click Discord summary copy       |   ⚠️   | `generateDiscordSummary()` is a pure domain function; **no UI** (`discord-summary-card.tsx` was deleted in `364c7a1`)                                                                                                                  |

### 2.1 Shipped Beyond the Original P0 Spec

| Capability                                            | Location                                                     | Notes                                                                                                                                                 |
| :---------------------------------------------------- | :----------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Categorized Daily/Weekly to-do board with drag & drop | `features/tasks/`, `cockpit-tasks-section.tsx`               | Offline-first IndexedDB (`holdmetoit_db`), debounced background sync, guest→user migration on login                                                   |
| Global Participant Preview Mode                       | `features/auth/presentation/auth-nav.tsx`, `preview-mode.ts` | 1-click header toggle for mods/devs to view all pages as regular participants globally                                                                |
| Feedback & bug reporting                              | `features/feedback/`, `app/api/feedback/route.ts`            | Floating trigger button, `FB-XX` codes, Discord bot embeds, LogRocket session link                                                                    |
| LogRocket observability                               | `core/observability/`                                        | Session replay, `error.tsx` / `global-error.tsx` boundaries                                                                                           |
| Manual weekly slot leaderboard                        | `features/leaderboard/*manual*`, `/challenge/[id]/manual`    | ⚠️ Stores `sessionHours` as `Decimal(6,2)`, which violates **Law L8** (integer seconds)                                                               |
| Dynamic cockpit banner (7 variants) & hero banner     | `cockpit-banner.ts`, `challenge-hero-banner.tsx`             | Matches the Figma                                                                                                                                     |
| `DEV` role                                            | `auth-roles.ts`, `discord-guild.service.ts`                  | Grants full admin plus developer access                                                                                                               |
| Admin roster participant removal                      | `challenge-manage-tab.tsx`, `challenge-admin.repository.ts`  | Host removes a participant (`UPCOMING`/`ACTIVE` only) with a mandatory audit reason; purges logs, punishment, leaderboard entry, and team-member rows |

---

## 3. Known Defects & Technical Debt (Prioritized)

|  #  | Severity | Issue                                                                                                                                                                                                                          | Suggested Fix                                                                                                                                                                     |
| :-: | :------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | 🔴 High  | Lock Results fails after natural expiry, so punishments are never evaluated (`assertCanLockChallenge` rejects `COMPLETED`)                                                                                                     | Allow lock/evaluate when status is `COMPLETED` and the challenge hasn't been finalized yet. That needs a persisted `finalizedAt` (or `resultsLockedAt`) column to stay idempotent |
| D2  | 🔴 High  | Audit trail in-memory fallback needs full persistence validation                                                                                                                                                               | Add migration check and verify Prisma `audit_logs` model insertion across all environments                                                                                        |
| D3  | 🔴 High  | Three P0 features have backend code but no UI: pardon modal, Discord summary copy, Punishment Wall                                                                                                                             | Rebuild them in Obsidian styling inside the Manage tab (admin pardon & Discord summary) and the Overview tab (public wall)                                                        |
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

### Sessions 1–73 (Summarized)

- Core domain math, Prisma models, Discord OAuth, participant cockpit, mobile pass, drag & drop across Daily/Weekly boards, offline-first IndexedDB task sync (`holdmetoit_db`), 2-card participant logging, admin 7-day hours overrides, law labels UI cleanup, moderator future hours prevention, cross-day task moving/rescheduling with validation, participant study log audit trail integration (`STUDY_LOG_ADDED`), dedicated public challenges catalog (`/challenges`) with role-gated admin controls, multi-view pagination guards (`DataPagination`), challenge-specific participant statistics profiles (`/challenge/[id]/participant/[participantId]`), multi-view search & team filtering with "View by Team" mode, dynamic team color palettes with WCAG AA contrast calculation (`team-colors.ts`), overall time reset to 0 (`executeAdminResetOverallHours`), and challenge tab reload URL sync (`challenge-tabs.ts`).

### Session 74 — 2026-10-10 (afnan)

- **Agent Role:** Participant UI Agent, Scoring & Engine Agent, Data & Identity Agent.
- **Yeolpumta (YPT) Study Logs V2 Integration & "Today's LB" View Mode:**
   - **Database & Prisma Schema Layer (`prisma/schema.prisma`):**
      - Added `User.yptId String? @unique` for reverse-engineered YPT identity binding without schema friction.
      - Cloned `study_logs_v2` (`DailyStudyLogV2` model) with foreign keys and unique composite key `[participantId, logDate]` plus live `status String?` field.
      - Applied non-destructive database migration on PostgreSQL/Supabase and executed `npx prisma generate` cleanly without data loss.
   - **Leaderboard Data Fetcher (`features/leaderboard/data/leaderboard-data.ts`):**
      - Switched `dailyStudyLogs` queries to read from `dailyStudyLogsV2` (including `status: true`).
      - Populated `ScoreboardStandingEntry.status` from latest log entry for live user activity.
   - **Curved YPT Status Badge (`challenge-leaderboard-tab.tsx`):**
      - Rendered status indicator capsule (`YptStatusPill`) matching team badge curved pill radius (`rounded-full`).
      - Strictly 2 text options: `"Studying"` (emerald tint `#132717`, border `#225028`, text `#86efac`) and `"Offline"` (slate tint `#1a1a1a`, border `#2e2e2e`, text `#a3a3a3`).
      - Emojis stripped per design directive.
   - **Dedicated "Today's LB" View Mode:**
      - Added pure domain ranking function `rankByTodaySeconds<T>()` in `features/leaderboard/domain/leaderboard.ts` adhering to **Law L7** (pure TypeScript domain function, zero ORM/React imports).
      - Ranks participants by `todayLoggedSeconds` descending, with secondary tie-breaker using `totalLoggedSeconds`.
      - Segmented switcher upgraded with 3 options: **`Overall Rank`** (Trophy), **`Today's LB`** (Clock, emerald accent), and **`View by Team`** (Users).
      - In **`Today's LB`** view:
         - Displays dynamic `todayRank` for mobile and desktop views.
         - Highlights `todayLoggedClock` as primary metric in emerald text (`text-[#4ade80]`), with cumulative hours as secondary.
         - Highlights table header with active indicator.
   - **V2 Alignment Across Edit Menus, Results Lock & Cockpit Data:**
      - **Admin Hours Override (`admin-override.repository.ts`):** Migrated `executeAdminHoursOverride` to query and upsert `prisma.dailyStudyLogV2` with `isOverride = true`, admin audit ID, and override reason. Host overrides now instantly update the V2 leaderboard and participant profile stats.
      - **Challenge Finalization & Dual-Failure Lock (`challenge-admin.repository.ts`):** Updated `lockChallengeResults` to evaluate participant punishment totals using `dailyStudyLogsV2` (with safe V1 fallback).
      - **Cascading Challenge Deletion (`challenge-admin.repository.ts`):** Updated `deleteChallenge` transaction to delete `dailyStudyLogV2` records alongside V1 records, preventing orphan logs.
      - **Home Cockpit Sync (`participant.repository.ts` & `cockpit-data.ts`):** Included `dailyStudyLogsV2` in `findParticipantForUser` and updated `cockpit-data.ts` to prioritize V2 study logs for total hours, today's study time, and catch-up deficit calculations.
   - **Unit Tests:**
      - Added 5 unit tests for `rankByTodaySeconds` in `features/leaderboard/domain/leaderboard.test.ts`.
      - Added interaction/render tests for `initialViewMode: "today"` in `challenge-leaderboard-tab.test.tsx`.
      - Updated Journey J5 in `quality-matrix-j1-j6.test.ts`, `challenge-admin.repository.test.ts`, and `participant.repository.test.ts`.
- **Quality Gates:** `npm run typecheck` ✅ (0 errors) · `npm run test` ✅ (75 files, 770/770 green).

### Session 75 — 2026-10-10 (afnan)

- **Agent Role:** Data & Identity Agent, Participant UI Agent, Scoring & Engine Agent.
- **Complete Removal of Legacy Daily Study Logs (V1) from Application Codebase:**
   - **Schema & Database Safety:**
      - Preserved PostgreSQL `daily_study_logs` table intact with all historic rows (zero data loss, zero destructive DB operations).
      - Retained `DailyStudyLog` model definition in `prisma/schema.prisma` per explicit user instruction.
   - **Application Codebase Migration to V2 (`DailyStudyLogV2`):**
      - **Study Logs Repository (`features/study-logs/data/daily-study-log.repository.ts`):** `upsertDailyStudyLog` and `findDailyLog` migrated exclusively to `prisma.dailyStudyLogV2` with default `status: "Offline"`.
      - **Participant Repository (`features/challenges/data/participant.repository.ts`):** Removed `dailyStudyLogs` from `include` queries; only `dailyStudyLogsV2` is requested from Prisma.
      - **Admin Challenge Repository (`features/challenges/data/challenge-admin.repository.ts`):**
         - `findAdminChallengeDetails`: Query now includes `dailyStudyLogsV2` with `overrideBy`.
         - `lockChallengeResults`: Dual-failure calculation evaluates participant totals purely from `dailyStudyLogsV2`.
         - `deleteChallenge`: Purged explicit transaction calls to legacy V1 study logs.
      - **Home Cockpit & Participant Stats (`cockpit-data.ts`, `participant-stats.repository.ts`):** Simplified log resolution to directly consume `participant.dailyStudyLogsV2 ?? []`.
   - **Test Suite Updates:**
      - Updated `daily-study-log.repository.test.ts`, `challenge-admin.repository.test.ts`, `participant.repository.test.ts`, `participant-stats.repository.test.ts`, and `quality-matrix-j1-j6.test.ts` to mock and assert `dailyStudyLogV2`.
   - **UI Polish:**
      - Removed team name and icon badge pill from `CockpitProgressCard` (`cockpit-progress-card.tsx`), keeping the Weekly Commitment Progress header minimal and focused on individual hours vs target commitments.
- **Quality Gates Verified:**
   - `npm run typecheck` ✅ (0 errors)
   - `npm run test` ✅ (75/75 test files passing, 770/770 tests green)
   - `npm run build` ✅ (10 routes compiled successfully)

### Session 76 — 2026-10-10 (afnan)

- **Agent Role:** Participant UI Agent, Scoring & Engine Agent.
- **Leaderboard View Mode URL Sync & Participant Profile Navigation Context Preservation:**
   - **Problem:** When viewing "Today's LB" (`viewMode = "today"`), clicking on any scholar's profile and returning back (via browser Back or profile breadcrumbs) reset the view to the default "Overall Rank" leaderboard because the view mode was stored only in component state.
   - **Pure Domain Resolution (`features/leaderboard/domain/leaderboard.ts`):**
      - Exported `LeaderboardViewMode` type (`"individual" | "today" | "team"`).
      - Added pure domain helper `resolveLeaderboardViewMode(value?: string | null): LeaderboardViewMode` adhering to **Law L7** (pure TypeScript, zero UI or framework dependencies). Defaults safely to `"individual"`.
      - Added 5 unit tests in `features/leaderboard/domain/leaderboard.test.ts`.
   - **Server Page Query Parameter Handling (`app/challenge/[id]/page.tsx`):**
      - Accepted optional `view?: string` in `searchParams`.
      - Sanitized initial view mode using `resolveLeaderboardViewMode(searchParams?.view)` and forwarded `initialLeaderboardViewMode` to `<ChallengeView>`.
   - **Client Presentation State & History Synchronization (`challenge-leaderboard-tab.tsx` & `challenge-view.tsx`):**
      - On view mode switch, `handleViewModeChange` updates component state, resets pagination to page 1, and updates browser URL query string via `window.history.replaceState` (setting `?view=today` or `?view=team`, while cleanly deleting `view` when `"individual"` for canonical cleanliness).
      - Listens to `popstate` events to restore view mode seamlessly on browser back/forward navigation.
      - Cleans up `view` parameter when switching away from the Leaderboard tab.
      - Added `getParticipantProfileUrl(participantId: string)` helper which automatically appends `?view=${viewMode}` when `viewMode !== "individual"`.
      - Updated all participant profile navigation links across podium cards, team view members, desktop table rows, and mobile cards to use `getParticipantProfileUrl`.
   - **Profile Breadcrumb & Empty State Context (`participant-profile-header.tsx`, `participant-stats-view.tsx`, `page.tsx`):**
      - Forwarded `viewParam` from profile `searchParams.view` down through `ParticipantStatsView` to `ParticipantProfileHeader`.
      - Updated the "Leaderboard" breadcrumb link and Empty State "Return to Leaderboard" button to navigate to `/challenge/[id]?tab=leaderboard&view=${viewParam}` when `viewParam` is present, restoring the exact previous view.
   - **Unit Tests:**
      - Added test in `challenge-leaderboard-tab.test.tsx` verifying profile links preserve `?view=today` in "today" mode and omit `?view` in "individual" mode.
- **Quality Gates Verified:**
   - `npm run typecheck` ✅ (0 errors)
   - `npm run test` ✅ (75/75 test files passing, 775/775 tests green)
   - `npm run build` ✅ (10 routes compiled successfully)

### Session 77 — 2026-10-10 (afnan-jr)

- **Agent Role:** Participant UI Agent, Scoring & Engine Agent, Data & Identity Agent.
- **Punishment Picture Disclosure in Overview & About Tab Merge:**
   - **Domain Layer (`features/challenges/domain/challenge-tabs.ts`):**
      - Merged `"about"` into `"overview"`. Updated `CHALLENGE_TABS = ["overview", "leaderboard", "manage", "audit"]` and `PUBLIC_CHALLENGE_TABS = ["overview", "leaderboard"]`.
      - Added automatic fallback in `resolveAllowedChallengeTab` where `requestedTab === "about"` redirects safely to `"overview"`, preserving backwards compatibility with legacy bookmarks and external links without 404s.
      - Updated `challenge-tabs.test.ts` (10/10 tests green).
   - **Presentation Layer (`features/challenges/presentation/`):**
      - **Navigation Bar (`challenge-view.tsx`):** Removed the standalone "About" tab button and its rendering branch; tabs now cleanly present Overview, Leaderboard, and role-gated admin tabs.
      - **Timetable (UTC) Merge (`challenge-overview-tab.tsx`):** Integrated the challenge timetable (Kickoff and Conclusion timestamps formatted in UTC) and challenge description into the Welcome card on the Overview tab.
      - **Forfeit Avatar & Accountability Disclosure Card (`challenge-overview-tab.tsx`):** Added dedicated card for challenge forfeit preview:
         - Clean header with card title "Forfeit Avatar & Accountability" (red alert icon, Forfeit Discord PFP pill badge, Law L6 subtitle, and bottom accountability rule note removed per user feedback for minimal Obsidian styling).
         - High-resolution preview of `challenge.punishmentPfpUrl` (`next/image`).
         - Direct "Download Forfeit PFP" button (`<a>` with `download` attribute and `target="_blank"`).
         - Graceful fallback state ("No Custom Forfeit Avatar Set") when no PFP is uploaded.
   - **Server Page (`app/challenge/[id]/page.test.tsx`):**
      - Updated page server tests to assert that `searchParams.tab = "about"` resolves cleanly to `data-initial-tab="overview"`.
   - **Unit Tests:**
      - Added unit tests in `challenge-overview-tab.test.tsx` covering Timetable rendering, Punishment PFP preview + download button, null fallback state, and absence of removed badges/labels (8/8 tests green).
- **Quality Gates Verified:**
   - `npm run typecheck` ✅ (0 errors)
   - `npm run test` ✅ (75/75 test files passing, 788/788 tests green)
   - `npm run build` ✅ (10 routes compiled successfully)

### Session 78 — 2026-10-10 (afnan-jr)

- **Agent Role:** Admin Operations & Broadcaster Agent, Data & Identity Agent.
- **Admin Roster Participant Removal (Delete Participant on Admin Control):**
   - **Repository (`features/challenges/data/challenge-admin.repository.ts`):** Added `removeChallengeParticipant`. Guards participant existence and blocks removal when the derived status is `COMPLETED` (allows `UPCOMING`/`ACTIVE`). Inside a transaction, deletes dependent rows explicitly in order — `dailyStudyLogV2` → `punishmentRecord` → `leaderboardEntry` (by `challengeId` + `userId`) → `teamMember` (by `userId` + `challengeId`) — then the `challengeParticipant`, and appends a `ROSTER_EDIT` audit event (previous roster state, `newValue: null`, required reason). The explicit deletes cover the `LeaderboardEntry`/`TeamMember` rows that do not cascade from `ChallengeParticipant`.
   - **Server Action (`features/challenges/api/challenge-admin.actions.ts`):** Added `removeChallengeParticipantAction` with a Zod schema (`challengeId`, `participantId`, `reason` min 3 chars), `requireAdminUser()` guard, scoreboard cache invalidation, and path revalidation.
   - **Presentation (`features/challenges/presentation/challenge-manage-tab.tsx`):** Added a destructive `UserMinus` control per roster row (hidden on `COMPLETED` challenges) and a confirmation modal requiring an audit reason, with success/error feedback. Removal is applied optimistically via local state (no `router.refresh()`), so the modal closes and only the removed row disappears instead of the whole route re-rendering.
   - **Test Suite:** Added repository tests (ordered deletes + audit, not-found, completed rejection) and action tests (success, short reason, non-admin), and extended the `challengeParticipant` Prisma mock with `delete`.
- **Quality Gates Verified:**
   - `npm run typecheck` ✅ (0 errors)
   - `npm run test` ✅ (75/75 test files passing, 794/794 tests green)
   - `npm run build` ✅ (11 routes compiled successfully)
- **NEXT STEP:** Fix D1 + D2 (challenge finalization & audit log persistence).
