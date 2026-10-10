# ISSUES.md — Project Audit & Known Issues Tracker

> **Audited:** 2026-10-10 · **Branch:** `krish` (commit `a32220b`)  
> **Method:** Full codebase inspection — config, schema, routes, features, domain, tests, security  
> **Total Findings:** 32 (5 critical · 10 medium · 12 low · 5 feature suggestions)

---

## 🔴 Critical / Immediate Fixes (Blocks Production)

### 1. Lock Results Fails After Natural Expiry (D1)

**The single biggest bug in the platform.**

`features/challenges/domain/challenge-lifecycle.ts` L78-L87 — `assertCanLockChallenge()` throws `"Challenge results are already locked and finalized"` when status is `COMPLETED`. But challenge status is **derived from timestamps** via `calculateChallengeStatus()`: once `endAt` passes naturally, status becomes `COMPLETED` automatically. This means:

- **Punishments are never evaluated** unless the host clicks "Lock" _before_ the clock runs out.
- The entire Law L6 accountability system is broken for challenges that end naturally.

**Fix:** Add a `resultsLockedAt DateTime?` column to `Challenge`. Let `assertCanLockChallenge` accept `COMPLETED` when `resultsLockedAt IS NULL`. Already documented in `HANDOFF.md` §6 as the exact next step.

---

### 2. Dual-Failure Runs on Hours Only — Law L6 Partial Violation (D4)

`lockChallengeResults` passes an empty `[]` for goals, so the Dual-Failure Invariant (`FEAT-PUN-01`) evaluates hours only. Weekly goals were dropped in migration `20261004030000` and replaced with user-scoped tasks that aren't linked to any challenge.

**Impact:** The entire goal-failure half of Law L6 is a no-op. This is a **product decision** that needs team sign-off — either re-introduce challenge-scoped goals or formally amend Law L6 to hours-only.

---

### 3. Five P0 Feature UIs Were Deleted, Backend Still Exists (D3)

These features have working backend code but **zero UI** — deleted in commits `88779bd` and `364c7a1`:

| Feature                                 | Backend                              | UI Status                                                           |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| Punishment Wall (`FEAT-PUN-02`)         | `punishment.ts` domain logic         | ❌ `punishment-wall.tsx` deleted                                    |
| Punishment PFP Download (`FEAT-PUN-03`) | PFP upload to Supabase works         | ❌ No download button anywhere                                      |
| Host Pardon Modal (`FEAT-PUN-04`)       | `adminPardonAction` exists           | ❌ `admin-goals-pardons.tsx` deleted                                |
| Discord Summary Copy (`FEAT-DISC-01`)   | `generateDiscordSummary()` works     | ❌ `discord-summary-card.tsx` deleted                               |
| Host Goal/Target Edit (`FEAT-DECL-04`)  | `adminUpdateParticipantTargetAction` | ✅ Wired to `AdminTargetOverrideModal` (Manage, Leaderboard, Stats) |

---

### 4. Schema Drift — No Migration Files for Production Tables (D5)

The `feedbacks` table, `categories`, `tasks`, and related `sort_order` columns were applied via `prisma db push` and have **no migration files**. Running `prisma migrate deploy` on a fresh database produces an incomplete schema.

**Fix:** Run `prisma migrate diff` to generate catch-up migrations and `prisma migrate resolve` on existing databases.

---

### 5. npm Audit: Active Security Vulnerabilities

`npm audit` reports **multiple high-severity** CVEs:

| Package                              | Severity    | Issue                                                                     |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------- |
| `brace-expansion` (via ESLint, glob) | 🔴 High     | DoS via uncontrolled recursion (GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7) |
| `braces` (via tailwindcss/chokidar)  | 🔴 High     | Stack exhaustion via nested patterns (GHSA-vfj7-8cjw-p6xm)                |
| `@vitest/mocker`                     | 🟠 Moderate | Path traversal / arbitrary file read (GHSA-82fw-gwwq-j7x9)                |

**Fix:** `npm audit fix` for `brace-expansion`. The `braces`/`tailwindcss` and `vitest` fixes require major version bumps (Tailwind v4, Vitest v5) — evaluate breaking changes first. At minimum, pin `brace-expansion` to a fixed version.

---

## 🟠 Medium Priority — Functional Issues & Law Violations

### 6. Hardcoded Seed Challenge ID Fallback

`app/page.tsx` L83:

```tsx
challengeId={cockpit?.challengeId ?? upcomingChallenge?.id ?? "seed-honey-bees-vs-lavender-butterflies"}
```

If a user has no active challenge and no upcoming challenge, the cockpit falls back to a seed data ID. In production, this seed challenge won't exist → the component will try to render data for a non-existent challenge.

**Fix:** Pass `null` and handle the no-challenge state in `HomeCockpitView`.

---

### 7. Fire-and-Forget DB Write in Auth Session Callback

`core/auth/index.ts` L64-L69:

```ts
prisma.user
   .update({ where: { id: user.id }, data: { role: "DEV" } })
   .catch(() => {});
```

This silently swallows all errors. If the DB write fails, the session says `DEV` but the database still says `PARTICIPANT`. On next page load without cache, role could revert. Use `await` or log the error.

---

### 8. Manual Leaderboard Uses `Decimal` Hours — Law L8 Violation (D7)

`prisma/schema.prisma` L278:

```prisma
sessionHours Decimal @map("session_hours") @db.Decimal(6, 2)
```

Law L8 mandates **integer total seconds** for all durations. The manual leaderboard stores floating-point hours, which introduces rounding discrepancies.

**Fix:** Migrate to `sessionSeconds Int` and update the domain/presentation layers.

---

### 9. `leaveDays` Collected Then Discarded (D6)

The enrollment modal collects a `leaveDays` input from participants, but the value has no database column and is silently thrown away. This creates confusion.

**Fix:** Either persist it and incorporate into the deficit/target math (carefully — Law L3 forbids grace passes), or remove it from the enrollment UI entirely.

---

### 10. Missing `not-found.tsx` and `error.tsx` Files — Law L9 Gaps

| Route                                             | `loading.tsx` | `error.tsx` | `not-found.tsx` |
| ------------------------------------------------- | ------------- | ----------- | --------------- |
| `app/` (root)                                     | ✅            | ✅          | ❌ **Missing**  |
| `app/admin/`                                      | ✅            | ❌          | ❌              |
| `app/admin/challenges/new/`                       | ❌            | ❌          | ❌              |
| `app/challenge/[id]/`                             | ✅            | ❌          | ❌              |
| `app/challenge/[id]/manual/`                      | ✅            | ❌          | ❌              |
| `app/challenge/[id]/participant/[participantId]/` | ✅            | ❌          | ❌              |
| `app/challenges/`                                 | ✅            | ❌          | ❌              |

Law L9 requires **Loading, Empty, and Error** states for every view. The root `error.tsx` catches unhandled errors globally, but route-specific `error.tsx` boundaries would prevent full-page crashes and give better UX. `not-found.tsx` files are needed for dynamic `[id]` routes especially.

---

### 11. Duplicate Lockfiles (D10)

Both `bun.lock` and `package-lock.json` exist. This creates install-time ambiguity and potential version drift between `bun install` and `npm install`.

**Fix:** Pick one package manager and delete the other lockfile. Add the chosen one to `package.json` `"packageManager"` field.

---

### 12. Missing Prisma Foreign Key Indexes (Performance)

Several foreign key columns lack database indexes, causing **sequential scans** on joins and cascading deletes:

| Model              | Column                               | Missing Index                                                         |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------- |
| `DailyStudyLog`    | `overrideById`                       | No `@@index([overrideById])`                                          |
| `PunishmentRecord` | `pardonedById`                       | No `@@index([pardonedById])`                                          |
| `Challenge`        | `startAt`, `endAt`                   | No composite index for status/date filtering in `/challenges` catalog |
| `AuditLog`         | `targetEntityType`, `targetEntityId` | No index for entity-specific audit lookups                            |

---

### 13. Tailwind Content Purge Missing `core/` and `lib/`

`tailwind.config.ts` scans `./app/`, `./components/`, and `./features/` but **not** `./core/` or `./lib/`. Files like `core/observability/logrocket-provider.tsx` that use Tailwind classes will have them purged in production builds.

**Fix:** Add `"./core/**/*.{ts,tsx}"` and `"./lib/**/*.{ts,tsx}"` to the `content` array.

---

### 14. `db:validate` Script Fails on Windows

`package.json` L14:

```json
"db:validate": "DATABASE_URL=postgresql://localhost:5432/holdmetoit prisma validate"
```

Uses POSIX inline variable syntax (`VAR=val cmd`) which fails on PowerShell/CMD. Use `cross-env` or just rely on Prisma's native `.env` loading.

---

### 15. Dual Team-Membership Modeling — Two Sources of Truth

The schema has two competing representations of team membership:

- `ChallengeParticipant.teamId` → links participants to teams
- `TeamMember(teamId, userId)` → a separate join table

`Team` has both `participants ChallengeParticipant[]` and `members TeamMember[]`. This creates ambiguity about which is authoritative. Consider consolidating.

---

## 🟡 Low Priority — Quality of Life & Hardening

### 16. `console.warn`/`console.error` in Production Code

| File                          | Line | Statement                                                      |
| ----------------------------- | ---- | -------------------------------------------------------------- |
| `app/api/feedback/route.ts`   | 72   | `console.warn("[Feedback] Discord dispatch failed...")`        |
| `app/api/feedback/route.ts`   | 94   | `console.error("[Feedback API Error]:", error)`                |
| `app/challenge/[id]/page.tsx` | 67   | `console.error("Failed to load challenge scoreboard:", error)` |

**Fix:** Replace with `captureLogRocketException` or a proper server-side logger. Console statements in prod create noise in serverless logs.

---

### 17. Hardcoded LogRocket App ID

`core/observability/logrocket.ts` L6:

```ts
export const LOGROCKET_APP_ID = "q9morb/holdmeintoit";
```

This should be an env variable (`NEXT_PUBLIC_LOGROCKET_APP_ID`) and listed in `.env.example`. If the LogRocket project changes, you'd need a code deploy to update it.

---

### 18. Missing `NEXT_PUBLIC_LOGROCKET_APP_ID` in `.env.example`

`.env.example` documents all Discord/Supabase env vars but is missing the LogRocket app ID and the `AUTH_URL` variable that's needed for production deploys.

---

### 19. Missing Test for `preview-mode.ts` Domain Logic

`features/auth/domain/preview-mode.ts` contains `getEffectiveAdminState()` — core business logic that determines admin/participant view rendering across the entire app. No test file exists. Every other domain file has tests.

---

### 20. `next.config.mjs` Missing Security Headers

No security headers are configured. Before production deployment, add:

- `X-Frame-Options: DENY` (clickjacking prevention)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (basic CSP)

---

### 21. No `global-error.tsx` at App Root

Next.js App Router requires `app/global-error.tsx` to catch errors that occur in the **root layout** itself. The existing `error.tsx` only catches errors in page components. If the root layout throws, users see a blank white page.

---

### 22. `force-dynamic` on Home Page May Hurt Performance

`app/page.tsx` L13:

```ts
export const dynamic = "force-dynamic";
```

Every visit to `/` skips all caching and hits the DB fresh. Consider using `revalidate` with a short TTL or ISR for spectators, while keeping dynamic rendering for authenticated users.

---

### 23. TSConfig Missing Critical Cross-Platform & Safety Flags

`tsconfig.json` is missing several important settings:

- **`forceConsistentCasingInFileNames: true`** — Windows is case-insensitive but Vercel (Linux) isn't. An import with wrong casing compiles on Windows, breaks in prod.
- **`noUncheckedIndexedAccess: true`** — Array/dict lookups (roster splits, deficit maps, `days[i]`) currently assume non-null without checks.
- **`target: "ES2022"`** — Missing explicit target; defaults can produce unexpected behavior.
- **`noFallthroughCasesInSwitch: true`** — Guards status-machine switch statements.
- Stale `"prototype"` in `exclude` array — directory doesn't exist.

---

### 24. ESLint Config is Extremely Loose

`.eslintrc.json` only extends `next/core-web-vitals` and `prettier`. Missing:

- `@typescript-eslint/no-floating-promises` — would catch the fire-and-forget DB write in auth (#7)
- `no-restricted-imports` rules to enforce Law L7 domain purity automatically
- `@typescript-eslint/no-unused-vars`
- `@typescript-eslint/consistent-type-imports`
- ESLint 8 itself is **EOL** (October 2024); should upgrade to ESLint 9 + flat config

---

### 25. Missing Vitest Coverage Tooling

`ROADMAP.md` Milestone Gate 1 requires **100% test coverage on domain calculation formulas**. But:

- No `@vitest/coverage-v8` installed
- No `test.coverage` block in `vitest.config.ts`
- No `npm run test:coverage` script in `package.json`

---

### 26. `components.json` Hooks Alias Points to Non-Existent Directory

`components.json` sets `aliases.hooks` to `"@/hooks"`, but no top-level `hooks/` directory exists. Running `npx shadcn-ui add` for components with hooks will create an unexpected root directory.

---

### 27. Schema ID Generator Inconsistency

Most models use `@default(cuid())` but `Category` and `Task` use `@default(uuid())`. This is a minor inconsistency that could confuse contributors — pick one strategy and standardize.

---

## 💡 Feature / QoL Improvement Suggestions

### 28. Challenge Status Badge Everywhere

Add a visual `UPCOMING` / `ACTIVE` / `COMPLETED` status badge to challenge cards in `/challenges` and the cockpit, with color coding matching the Obsidian theme.

### 29. Participant Self-Removal from Challenge

Currently, once enrolled, participants cannot leave a challenge. Consider adding a "Leave Challenge" action (only during `UPCOMING` phase).

### 30. Challenge Duration Display

Show "X days left" or "Ended X days ago" on challenge cards and headers. The `calculateChallengeStatus` function already has the timestamps — surface them in the UI.

### 31. Bulk Import Participants

Admin currently adds participants one by one. A bulk import (paste Discord IDs or @usernames) would save significant setup time for larger challenges.

### 32. Data Export

Add CSV/JSON export for challenge results. This complements Law L2 (Spreadsheet Exorcism) — the platform does the math, but hosts may still want raw data for announcements or record-keeping.

---

## 📊 Summary Scorecard

| Category                        | Count  |
| ------------------------------- | ------ |
| 🔴 Critical (blocks production) | 5      |
| 🟠 Medium (functional issues)   | 10     |
| 🟡 Low (hardening / QoL)        | 12     |
| 💡 Feature suggestions          | 5      |
| **Total findings**              | **32** |

### Recommended Fix Order

1. **#1** — Lock Results bug (challenge finalization + `resultsLockedAt` column)
2. **#4** — Schema drift (generate catch-up migration files)
3. **#5** — `npm audit fix` for high-severity CVEs
4. **#12** — Add missing Prisma foreign key indexes
5. **#3** — Restore deleted P0 UIs (Punishment Wall, PFP download, Pardon, Discord Summary)
6. **#6** — Remove hardcoded seed challenge ID
7. **#7** — Fix fire-and-forget DB write in auth callback
8. **#10** — Add missing `error.tsx` / `not-found.tsx` route files
9. **#13** — Fix Tailwind content purge paths
10.   **#15** — Consolidate dual team-membership modeling
11.   **#23** — Add missing TSConfig flags (`forceConsistentCasingInFileNames`)
12.   Everything else in priority order
