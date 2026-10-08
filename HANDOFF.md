# HANDOFF.md — Engineering Operational Relay & Milestone Tracker

> **Project:** HoldMeToIt (Gamified Study Accountability & Challenge Management Platform)  
> **Repository:** `github.com/Afnanpathan2004/holdmetoit`  
> **Integration Branch:** `main` (latest: `c174a58`, PR #12) · Personal branches: `krish`, `afnan`, `afnan-jr`, `dev`  
> **Document Status:** Active Operational Relay (Living Document)  
> **Last Updated:** 2026-10-06 (Session 48 — codebase audit & documentation sync)  
> **Governance:** Subject to strict **Handoff Pruning & Obsolescence Rule (§9.3 in `AGENTS.md`)**  

---

## 1. Current State at a Glance

| Gate | Result (2026-10-09, branch `krish`) |
| :--- | :--- |
| `npm run typecheck` | ✅ 0 errors (`npx tsc --noEmit`) |
| `npm run test` | ✅ 62 files, 659/659 tests green |
| `npm run build` | ✅ 8 routes compiled |
| Phase 0 feature parity (vs `FEATURES.md`) | ⚠️ **~80%** — Global participant preview toggle in header, core daily/weekly loop, 2-card participant hours logging, full-week daily todos, mod/dev Event Audit Log & full-week hours override tools complete |
| Phase 0 Milestone Gate 1 (`ROADMAP.md` §3.4) | ❌ Not passed: no live pilot challenge has run; Vercel deployment not recorded in the repo |
| Phase 1 (P1) | ⏸️ Not started |

### 1.1 Live Routes
| Route | Purpose | Access |
| :--- | :--- | :--- |
| `/` | Home cockpit: banner variants, progress/deficit card, Log Hours modal, Daily/Weekly task board | Guest (local tasks only) / Participant |
| `/challenge/[id]` | Tabs: Overview · Leaderboard · About · Manage (admin only) | Public spectator |
| `/challenge/[id]/manual` | Manual weekly slot-hours leaderboard (host-entered) | Public view, admin entry |
| `/admin` | Admin console: events list, Create Challenge button | `ADMIN` / `DEV` |
| `/admin/challenges/new` | Challenge creator wizard (2 required image uploads) | `ADMIN` / `DEV` |
| `POST /api/feedback` | Bug/suggestion intake → DB + Discord embed | Anyone |
| `POST /api/tasks/sync` | Offline task queue batch sync | Authenticated |

> **Removed routes:** `/dashboard` (replaced by `/`) and `/admin/challenges/[id]/roster` (replaced by the Manage tab). Several `revalidatePath("/dashboard")` calls remain and do nothing; they're harmless but should be cleaned up.

### 1.2 RBAC Model
- `DEV` → Discord snowflake listed in `DEV_DISCORD_IDS` (JSON array; legacy alias `DISCORD_DEV_IDS` still read).
- `ADMIN` → user holds a role in `DISCORD_ADMIN_ROLE_IDS` within `DISCORD_GUILD_ID` (looked up with `DISCORD_BOT_TOKEN`; OAuth scope stays `identify`).
- `PARTICIPANT` → everyone else. The `DISCORD_ADMIN_IDS` whitelist has been removed.
- **Global Participant Preview:** Admins and devs can toggle a global cookie (`holdmetoit_preview_as_participant`) from the header next to "Admin Console". When active, all pages (`/`, `/challenge/[id]`, etc.) render exactly as regular participants see them (hiding Manage tab, Event Audit tab, host override controls, and DEV badge).

---

## 2. Phase 0 (MVP Core) Feature Status Matrix — Verified Against Code

Legend: ✅ Done end-to-end · ⚠️ Partial / backend-only / deviates from spec · ❌ Missing

| Feature ID | Feature | Status | Evidence / Gap |
| :--- | :--- | :---: | :--- |
| `FEAT-AUTH-01` | Discord OAuth (`identify`) | ✅ | `core/auth/index.ts`; role synced on sign-in via `syncUserRoleFromDiscord` |
| `FEAT-AUTH-02` | Public spectator mode | ✅ | `app/challenge/[id]/page.tsx` renders without a session |
| `FEAT-CHAL-01` | Multi-format challenge creator | ✅ | `/admin/challenges/new`; banner + PFP uploads go to Supabase Storage |
| `FEAT-CHAL-02` | Host manual kickoff | ✅ | Manage tab → `kickoffChallengeAction` (sets `startAt = now`; status is derived from timestamps) |
| `FEAT-CHAL-05` | Lock final results | ⚠️ | Manage tab → `lockChallengeResultsAction`. **Bug:** once `endAt` passes on its own, status becomes `COMPLETED` and `assertCanLockChallenge` throws, so punishments are **never evaluated** unless the host locks *before* the end time |
| `FEAT-CHAL-06` | Duo partner self-naming | ❌ | No participant-side duo naming code exists. Only hosts can rename teams (Manage tab → Team Identities) |
| `FEAT-AUDIT-01` | Append-only audit trail | ⚠️ | `features/audit/data/audit-log.repository.ts` stores events in PostgreSQL (`audit_logs`) and in-memory fallback. Event Audit tab UI live in `/challenge/[id]`. |
| `FEAT-DECL-01` | Declared target hours (`HH:MM:SS`) | ✅ | Entered in the enrollment modal (1–105h). Note: `leaveDays` is accepted by the action but **silently discarded** (no column) |
| `FEAT-DECL-02` | Mandatory weekly goals checklist | ⚠️ | `WeeklyGoal` was dropped (migration `20261004030000`). It was replaced by **user-scoped** Daily/Weekly categorized tasks (`features/tasks/`) that are **not linked to any challenge** |
| `FEAT-DECL-03` | Declaration lock on `ACTIVE` | ✅ | Targets can't be edited after enrollment at all. Late enrollment is still allowed while `ACTIVE` (only `COMPLETED` blocks it) |
| `FEAT-DECL-04` | Host goal/target edit | ❌ | No goals exist to edit, and `updateParticipantTargetSeconds` has no callers |
| `FEAT-LOG-01` | Daily `HH:MM:SS` self-logging | ✅ | `daily-hours-modal.tsx`: participants restricted to today/yesterday self-logging (`ONLY_TODAY_OR_YESTERDAY_ALLOWED`), non-scrolling 7-day selector, native picker (`max=today`), domain guards |
| `FEAT-LOG-02` | 24h single-day limit | ✅ | `MAX_DAILY_LOG_SECONDS` in `daily-log.validation.ts` |
| `FEAT-LOG-04` | Admin inline hours override UI | ✅ | `AdminHoursOverrideModal`: mods and devs (`ADMIN`, `DEV`) can override any participant's hours for any day of the week (D1..D7) with mandatory audit reason; integrated into Manage tab roster & Leaderboard tab |
| `FEAT-LEAD-01` | Head-to-head scoreboard | ✅ | `challenge-leaderboard-tab.tsx`: matchup card with share % and team targets |
| `FEAT-LEAD-02` | Unified standings table | ✅ | Desktop table plus mobile card layout. No "Goals Done" column (goals no longer exist) |
| `FEAT-LEAD-03` | Catch-up deficit engine | ✅ | `deficit.ts` + `cockpit-progress-card.tsx` |
| `FEAT-PUN-01` | Dual-failure auto-flagging | ⚠️ | `lockChallengeResults` passes `[]` as goals, so **Law L6 runs on hours only** |
| `FEAT-PUN-02` | Punishment Wall | ❌ | `punishment-wall.tsx` was deleted in `88779bd`. The Overview tab only mentions it in copy |
| `FEAT-PUN-03` | Punishment PFP download button | ❌ | PFP upload works; there's no download button anywhere in the UI |
| `FEAT-PUN-04` | Host pardon | ⚠️ | `adminPardonAction` exists; **no UI** (`admin-goals-pardons.tsx` was deleted in `364c7a1`) |
| `FEAT-DISC-01` | 1-click Discord summary copy | ⚠️ | `generateDiscordSummary()` is a pure domain function; **no UI** (`discord-summary-card.tsx` was deleted in `364c7a1`) |

### 2.1 Shipped Beyond the Original P0 Spec
| Capability | Location | Notes |
| :--- | :--- | :--- |
| Categorized Daily/Weekly to-do board with drag & drop | `features/tasks/`, `cockpit-tasks-section.tsx` | Offline-first IndexedDB (`holdmetoit_db`), debounced background sync, guest→user migration on login |
| Global Participant Preview Mode | `features/auth/presentation/auth-nav.tsx`, `preview-mode.ts` | 1-click header toggle for mods/devs to view all pages as regular participants globally |
| Feedback & bug reporting | `features/feedback/`, `app/api/feedback/route.ts` | Floating trigger button, `FB-XX` codes, Discord bot embeds, LogRocket session link |
| LogRocket observability | `core/observability/` | Session replay, `error.tsx` / `global-error.tsx` boundaries |
| Manual weekly slot leaderboard | `features/leaderboard/*manual*`, `/challenge/[id]/manual` | ⚠️ Stores `sessionHours` as `Decimal(6,2)`, which violates **Law L8** (integer seconds) |
| Dynamic cockpit banner (7 variants) & hero banner | `cockpit-banner.ts`, `challenge-hero-banner.tsx` | Matches the Figma |
| `DEV` role | `auth-roles.ts`, `discord-guild.service.ts` | Grants full admin plus developer access |

---

## 3. Known Defects & Technical Debt (Prioritized)

| # | Severity | Issue | Suggested Fix |
| :---: | :---: | :--- | :--- |
| D1 | 🔴 High | Lock Results fails after natural expiry, so punishments are never evaluated (`assertCanLockChallenge` rejects `COMPLETED`) | Allow lock/evaluate when status is `COMPLETED` and the challenge hasn't been finalized yet. That needs a persisted `finalizedAt` (or `resultsLockedAt`) column to stay idempotent |
| D2 | 🔴 High | Audit trail in-memory fallback needs full persistence validation | Add migration check and verify Prisma `audit_logs` model insertion across all environments |
| D3 | 🔴 High | Five P0 features have backend code but no UI: override grid, pardon, Discord summary copy, Punishment Wall, PFP download | Rebuild them in Obsidian styling inside the Manage tab (admin) and the Overview tab (public wall + download) |
| D4 | 🟠 Med | Law L6 runs on hours only: goals aren't challenge-scoped any more | **Product decision needed** (see §4) |
| D5 | 🟠 Med | Schema drift: the `feedbacks` table and the `sort_order` columns on `categories`/`tasks` were applied with `db push` and have **no migration files**. `prisma migrate deploy` on a fresh DB would produce an incomplete schema | Generate catch-up migrations (`prisma migrate diff`) and `migrate resolve` them on existing DBs |
| D6 | 🟡 Low | `leaveDays` is collected in the enrollment modal and then discarded | Either persist it and feed it into the deficit/target math, or remove it from the UI |
| D7 | 🟡 Low | Manual leaderboard uses `Decimal` hours (Law L8 deviation) | Migrate to integer `sessionSeconds` |
| D8 | 🟡 Low | Stale `revalidatePath("/dashboard")` calls; `DISCORD_DEV_IDS` alias; `DEFAULT_FEEDBACK_CHANNEL_ID` hardcoded | Clean up |
| D9 | 🟡 Low | "E2E J1–J6" suite (`features/e2e/quality-matrix-j1-j6.test.ts`) mocks Prisma; there's no real browser E2E | Add Playwright journeys once the D3 UIs are back |
| D10 | 🟡 Low | Duplicate lockfiles (`bun.lock` + `package-lock.json`); `npm audit` reports 20 vulns (3 critical) | Pick one package manager; run `npm audit` triage |

---

## 4. Open Product Decisions (Require Team Sign-off)

1. **Goals vs Law L6:** Should challenges get a challenge-scoped goal list again (e.g. link Weekly tasks to an enrollment), or should Law L6 be formally amended to hours-only? Until this is decided, `FEAT-DECL-02/04` and `FEAT-PUN-01` stay ⚠️.
2. **Leave days:** Should declared leave days reduce the target or the days remaining in the catch-up math? Law L3 forbids grace passes, so this needs an explicit ruling.
3. **Late enrollment while `ACTIVE`:** Is this intended? It's allowed today.
4. **Design authority:** `DESIGN.md` now documents the Obsidian system (it replaced "Cozy Study Café" on 2026-10-04). Confirm this is ratified.

---

## 5. Foundational Laws — Compliance Snapshot

| Law | Status | Note |
| :--- | :---: | :--- |
| L1 Mathematical Unity | ✅ | Single `Team` entity with `maxMembers` |
| L2 Spreadsheet Exorcism | ✅ | Full-week admin override UI and auto-aggregating standings eliminate manual arithmetic |
| L3 Catch-Up Deficit | ✅ | `deficit.ts`; no grace passes |
| L4 Discord Identity | ✅ | OAuth only; public spectator |
| L5 Admin Override Absolute | ✅ | `adminOverrideStudyHoursAction` + `AdminHoursOverrideModal` live in Manage tab & Leaderboard tab |
| L6 Dual-Failure | ⚠️ | Hours-only (D4) |
| L7 Pure Domain Isolation | ✅ | `domain/` folders are framework-free |
| L8 Second-Level Precision | ⚠️ | Main logs ✅; manual leaderboard uses `Decimal` hours (D7) |
| L9 Zero-State Resilience | ✅ | `loading.tsx` on all routes; `EmptyState` / `ErrorState` components |

---

## 6. Immediate Next Step (For Incoming Agent)

> [!IMPORTANT]
> **EXACT NEXT STEP:** Fix **D1 + D2** together as one vertical slice (`fix/challenge-finalization`):
> 1. Add `Challenge.resultsLockedAt DateTime?` to `prisma/schema.prisma` and create a migration.
> 2. Ensure `audit-log.repository.ts` persists all audit entries into the `AuditLog` table using Prisma.
> 3. Let `lockChallengeResults` run when status is `ACTIVE` **or** (`COMPLETED` and `resultsLockedAt IS NULL`); set `resultsLockedAt` inside the transaction.
> 4. Update the lifecycle and lock unit tests, then run typecheck, test, and build.
>
> Then restore the remaining P0 UIs (Punishment Wall + PFP download on the Overview tab; pardon modal and Discord summary copy in the Manage tab).

---

## 7. Session Changelog (Last 3–5 Sessions)

### Sessions 1–55 (Summarized)
- Core domain math, Prisma models, Discord OAuth, participant cockpit, mobile pass, drag & drop across Daily/Weekly boards, offline-first IndexedDB task sync (`holdmetoit_db`), 2-card participant logging, and admin 7-day hours overrides.

### Session 60 — 2026-10-08 (krish)
- **Agent Role:** Admin Operations & Participant UI Agent.
- **Admin Hours Override UX & Law Labels Cleanup:**
  - Removed hour preset pills (`0h`, `1h`, `2h`, `4h`) from `AdminHoursOverrideModal` and replaced them with a single "Clear Time" button to reset hours/minutes/seconds to 0.
  - Removed "Law L5 Audit" from the modal header.
  - Performed a site-wide audit and stripped internal "Law" labels from the UI across all components (`challenge-manage-tab.tsx`, `cockpit-progress-card.tsx`, etc.).
- **Weekly & Daily Task Category Sharing:**
  - Configured Daily tasks to inherit Weekly categories as parent categories while preserving the ability to create independent categories for Daily tasks.
- **Merged `origin/dev` into `krish`:**
  - Merged incoming changes from `origin/dev` (commit `044bd81` introducing prettier/eslint precommit hooks and formatting).
  - Resolved conflicts in `features/challenges/presentation/challenge-manage-tab.tsx`, preserving Danger Zone / Delete Challenge functionality and clean UI free of internal Law labels.
- **Quality Gates:** `npx tsc --noEmit` ✅ (0 errors) · `npm run test` ✅ (62 files, 629/629 green).
- **NEXT STEP:** Fix D1 + D2 (challenge finalization & audit log persistence).

### Session 61 — 2026-10-08 (krish)
- **Agent Role:** Admin Operations & Scoring Engine Agent.
- **Moderator Future Hours Prevention:**
  - Implemented strict guards across domain, API, and UI layers so even moderators/admins cannot add or edit future hours for participants:
    - **Domain (`challenge-day.ts`):** `getChallengeDayOptions` correctly flags future days as `isFuture: true` even if a challenge is upcoming. Added `validateAdminOverrideChallengeDay` which allows earlier past days (unlike participants who are locked to today/yesterday) while strictly rejecting future challenge days or future dates with `FUTURE_DATE_NOT_ALLOWED`.
    - **Server Action (`admin-override.actions.ts`):** Added a future date check on `parsed.data.logDate > todayDateKey` returning `{ ok: false, code: "FUTURE_DATE_NOT_ALLOWED", message: "Cannot log or edit study time for future dates." }`.
    - **Repository (`admin-override.repository.ts`):** Added safety invariant throwing an error if attempting to execute an override on a future date.
    - **Admin Override Modal (`admin-hours-override-modal.tsx`):** Clamped initial day selection, disabled future day buttons, and guarded submit.
    - **Challenge Manage Tab (`challenge-manage-tab.tsx`):** Disabled future day buttons in 7-day breakdown strip.
- **Quality Gates:** `npx tsc --noEmit` ✅ (0 errors) · `npm run test` ✅ (62 files, 639/639 green) · `npm run build` ✅.

### Session 62 — 2026-10-08 (krish)
- **Agent Role:** Participant UI & Scoring Engine Agent.
- **Block Adding Todo Tasks to Past Challenge Days:**
  - Implemented comprehensive guards across domain and presentation layers to block adding new todo tasks to past days of the challenge while preserving status changes and edits for existing tasks:
    - **Domain (`challenge-day.ts`):**
      - Added `isPast: boolean` property to `ChallengeDayOption`.
      - Computed `isPast` across both `getChallengeDayOptions` (`rawCurrentDayNumber > 0 && d < rawCurrentDayNumber`) and `getCalendarWeekDayOptions` (`dayUtc < todayUtc`).
      - Added `isChallengeDayInPast` and `validateAddTaskChallengeDay` domain validation helpers with unit tests in `challenge-day.test.ts`.
    - **Presentation (`cockpit-tasks-section.tsx`):**
      - Added `isActiveDayPast` state detection based on `activeDayOption.isPast` and `selectedDateKey < effectiveTodayDate`.
      - **Daily Todos Header:** Displays a `Locked` badge alongside the day badge when viewing a past day.
      - **Empty State:** When viewing a past day with no tasks, displays a locked past-day notice ("This challenge day has passed. New tasks cannot be added to past days.") and hides the "+ Add todo" button.
      - **Bottom Action Button:** Replaced "+ Add more todos" with a disabled, styled locked button ("Past day locked (new tasks blocked)").
      - **Add Todo Modal:**
        - Clamped `openAddDailyModal` so opening the modal while viewing a past day defaults to today or the earliest available non-past day.
        - In the 7-day selector grid, disabled past days with `disabled={true}`, opacity-40, `cursor-not-allowed`, and a lock icon.
        - Guarded `handleAddTodoSubmit` against submitting tasks for past challenge days.
      - **Drag & Drop:** Blocked dropping tasks or categories from weekly into daily when viewing a past day.
      - **Existing Tasks on Past Days:**
        - Checkbox toggles and status badges ("Completed", "In Progress", "Crossed Out") remain fully functional.
        - Edit Task Modal keeps the task's original past day selected while locking all other past days from being selected, and `handleSaveEditTask` prevents moving tasks into different past days.
        - Deleting tasks or categories containing tasks on past days is strictly blocked with disabled buttons and locked tooltips.
- **Quality Gates:** `npx tsc --noEmit` ✅ (0 errors) · `npm run test` ✅ (62 files, 647/647 green) · `npx next build` ✅ (8 routes compiled).
- **NEXT STEP:** Fix D1 + D2 (challenge finalization & audit log persistence).

### Session 63 — 2026-10-09 (krish)
- **Agent Role:** Participant UI & Scoring Engine Agent.
- **Fix Weekly-to-Daily Drag-and-Drop Due Date Bug:**
  - Resolved bug where dragging a task from Weekly Todos to Daily Todos assigned it to Day 1 of the challenge (due to fallback to `task.createdAt`) instead of the active/selected challenge day:
    - **Domain (`task-reorder.ts`):**
      - Added optional `targetDueDate?: string | null` to `MoveTaskParams` and `MoveCategoryParams`.
      - In `moveTaskBetweenCategories`, resolved `dueDate`: if `targetDueDate` is provided, assign `targetDueDate`; if moving to `"weekly"`, reset `dueDate: null`; otherwise preserve existing `dueDate`.
      - In `moveCategoryBetweenColumns`, cascaded `targetDueDate` to member tasks when moving cross-column.
      - Added unit tests in `task-reorder.test.ts` verifying `targetDueDate` assignment when moving tasks or categories.
    - **Presentation (`cockpit-tasks-section.tsx`):**
      - In `handleTaskDrop`, `handleCategoryDrop`, and `handleColumnDrop`: passed `targetDueDate: selectedDateKey` when moving from Weekly to Daily (`isMovingWeeklyToDaily`), and `targetDueDate: null` when moving from Daily to Weekly.
      - Updated local IndexedDB persistence (`putLocalTasks` / `putLocalTask`) to store the resolved `dueDate`.
      - Included `dueDate: res.movedTask.dueDate ?? null` in `enqueueMutation` payload for `action: "MOVE"` to synchronize the assigned day with the server.
      - Added unit tests in `cockpit-tasks-section.test.tsx` verifying that a daily task with Day 1 `createdAt` and Day 4 `dueDate` renders under Day 4 in Daily Todos.
- **Quality Gates:** `npx tsc --noEmit` ✅ (0 errors) · `npm run test` ✅ (62 files, 650/650 green) · `npx next build` ✅ (8 routes compiled).
- **NEXT STEP:** Fix D1 + D2 (challenge finalization & audit log persistence).

### Session 64 — 2026-10-09 (krish)
- **Agent Role:** Participant UI & Scoring Engine Agent.
- **Move Daily Todo Tasks Across Challenge Days (with Past Day Guard):**
  - Implemented the ability to reschedule/move daily todo tasks from previous days to another day (today or future), with strict rejection of moving present or future tasks to past challenge days:
    - **Domain (`challenge-day.ts`):**
      - Created `validateMoveTaskChallengeDay(sourceDateKey, targetDateKey, todayDateKey)` pure domain validation function:
        - Allows moving tasks from previous days to today or future challenge days (`MOVED_FROM_PAST_TO_PRESENT_OR_FUTURE`).
        - Allows moving tasks between non-past days (`MOVED_FUTURE`, `MOVED_SAME_DAY`).
        - Strictly rejects moving present/future tasks to past days with `PAST_DAY_MOVE_NOT_ALLOWED`.
        - Rejects moving past-day tasks to a different past day with `TARGET_DAY_IN_PAST`.
        - Permitted maintaining tasks on the same day (`SAME_DAY`).
      - Added 8 unit tests covering all matrix permutations in `challenge-day.test.ts` (38/38 tests green).
    - **Presentation (`cockpit-tasks-section.tsx`):**
      - Implemented `moveTaskToDay(taskId, targetDateKey, sourceCatIdx, sourceColumn)`: updates local state, writes to IndexedDB (`putLocalTask`), enqueues sync mutation (`UPDATE`/`MOVE`), and executes server action (`updateTaskAction`).
      - **7-Day Strip Drag & Drop:**
        - Updated `handleTaskDragStart` to record `sourceDateKey` on `draggedItem`.
        - Added `handleDayPillDragOver` and `handleDayPillDrop` on the 7-day pill switcher buttons.
        - Added reactive drag feedback: green drop highlight ring for eligible days, red ring / cursor-not-allowed / lock icon indicator for disallowed past days.
      - **3-Dots / Context Menu Quick Actions:**
        - Added "Move to Day" section for daily tasks with 1-click "Move to Today" (highlighted emerald when task is on a past day) and quick buttons for other eligible future challenge days.
      - **Edit Task Modal:**
        - Enabled selecting today or future days when editing a past-day task; past days remain locked for tasks on present or future days.
        - Validated day changes with `validateMoveTaskChallengeDay` on modal save.
      - Added tests in `cockpit-tasks-section.test.tsx` verifying day tab attributes and rendering.
- **Quality Gates:** `npx tsc --noEmit` ✅ (0 errors) · `npm run test` ✅ (62 files, 659/659 green) · `npx next build` ✅ (8 routes compiled).
- **NEXT STEP:** Fix D1 + D2 (challenge finalization & audit log persistence).



