# HANDOFF.md — Engineering Operational Relay & Milestone Tracker

> **Project:** HoldMeToIt (Gamified Study Accountability & Challenge Management Platform)  
> **Repository:** `github.com/Afnanpathan2004/holdmetoit`  
> **Integration Branch:** `main` (latest: `c174a58`, PR #12) · Personal branches: `krish`, `afnan`, `afnan-jr`, `dev`  
> **Document Status:** Active Operational Relay (Living Document)  
> **Last Updated:** 2026-10-06 (Session 48 — codebase audit & documentation sync)  
> **Governance:** Subject to strict **Handoff Pruning & Obsolescence Rule (§9.3 in `AGENTS.md`)**  

---

## 1. Current State at a Glance

| Gate | Result (2026-10-07, branch `krish`) |
| :--- | :--- |
| `npm run typecheck` | ✅ 0 errors (`npx tsc --noEmit`) |
| `npm run test` | ✅ 58 files, 610/610 tests green |
| `npm run build` | ✅ 8 routes compiled |
| Phase 0 feature parity (vs `FEATURES.md`) | ⚠️ **~74%** — Core daily/weekly loop, today/yesterday participant task & logging restriction, mod/dev 7-day full-week tasks & "Edit hr" options on participants views complete |
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
| `FEAT-AUDIT-01` | Append-only audit trail | ⚠️ | `features/audit/data/audit-log.repository.ts` stores events **in a module-level in-memory array**. They're lost on every serverless cold start. There's no `AuditLog` Prisma model and no Audit Trail UI |
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
| D2 | 🔴 High | Audit trail is in-memory only, which breaks `FEAT-AUDIT-01` and Law L5's audit guarantee | Add an `AuditLog` Prisma model plus a migration; make the repository insert-only |
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

### Earlier Sessions (Summarized)
- **Sessions 1–51 (2026-09-05 – 10-06):** Core domain math, Prisma models, Discord OAuth, participant cockpit, mobile pass, drag & drop across Daily/Weekly boards, offline-first IndexedDB task sync (`holdmetoit_db`), task multi-state overhaul (`TODO`, `IN_PROGRESS`, `COMPLETED`, `CROSSED_OUT`).

### Session 52 — 2026-10-06 (krish)
- **Agent Role:** Participant UI & Data Agent.
- **Week-Wide Daily Todos & Interactive Day Switcher:**
  - Added `dueDate` column and mapped `AuditLog` model in `schema.prisma`.
  - Added 7-day pill switcher bar in `cockpit-tasks-section.tsx` with completion tallies (`completed/total`) and non-scrolling grid layout.
  - Allowed assigning/scheduling tasks across the 7-day challenge week while defaulting initial view to current day's todos.

### Session 53 — 2026-10-07 (krish)
- **Agent Role:** Participant UI & Admin Operations Agent.
- **Participant Today/Yesterday Restriction & Mod/Dev Full-Week Override UI (FEAT-LOG-04 / Law L5):**
  - **Domain Layer (`challenge-day.ts`):** Restricted participant study hours self-logging to today or yesterday (`ONLY_TODAY_OR_YESTERDAY_ALLOWED`).
  - **Participant UI (`daily-hours-modal.tsx`):** Locked past days D1..D7 beyond today/yesterday; date picker clamped between `min={yesterdayDate}` and `max={todayDate}`.
  - **Admin Override UI (`admin-hours-override-modal.tsx`):** Built dedicated modal for moderators (`ADMIN`) and developers (`DEV`) allowing full 7-day week (D1..D7) hours adjustments for any participant with mandatory audit note.
  - **Manage & Leaderboard Integration:** Added initial override triggers in Manage tab and Leaderboard tab.

### Session 56 — 2026-10-07 (krish)
- **Agent Role:** Participant UI & Data Identity Agent.
- **Discord OAuth RFC 9207 Issuer Validation Fix:**
  - **Issue:** Discord enabled RFC 9207 (`iss=https://discord.com`) on authorization callbacks; Auth.js v5 without explicit `issuer` defaulted to `https://authjs.dev/`, throwing `CallbackRouteError: unexpected "iss" (issuer) response parameter value` and redirecting to `/api/auth/error?error=Configuration` (HTTP 500).
  - **Fix (`core/auth/index.ts`):** Explicitly configured `issuer: "https://discord.com"` on the Discord provider.
- **Participant Preview Mode (`app/page.tsx`):**
  - Added moderator/developer preview toggle via `/?as=participant` (or `?preview=participant`) enabling admins and devs to test the dashboard cockpit exactly as regular participants see it.
  - Added sticky preview alert banner with 1-click "Exit Preview" link, and a Dev mode toggle in the header.
- **2-Card Daily Hours Selector UX (`daily-hours-modal.tsx`):**
  - Replaced the compressed strip with an intuitive 2-column card selector ("Today" / "Yesterday") for regular participants with formatted date stamps (`Oct 7`), logged badges, and D-day indicators, while retaining the 7-day grid for admins.
  - Added [`formatDayDate`](features/study-logs/domain/challenge-day.ts) pure domain date formatter.
- **Cockpit Tasks 7-Day Switcher Polish (`cockpit-tasks-section.tsx`):**
  - Cleaned up day pill labels with text truncation and tooltip titles to eliminate text overlap across mobile and desktop.
- **Quality Gates:** `npx tsc --noEmit` ✅ (0 errors) · `npm run test` ✅ (58 files, 610/610 green) · `npx next build` ✅ (8 routes compiled).
