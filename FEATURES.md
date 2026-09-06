# HoldMeToIt — Master Feature Specification

> **Document Version:** 2.0  
> **Source of Truth:** Repository Root — Authoritative Product Feature Catalog  
> **Rule:** Every screen, user flow, and functional capability across all product phases is detailed here.  
> **Last Updated:** 2026-09-05  

---

## 1. Phase Legend & Delivery Roadmap

All features are strictly tagged with their planned deployment phase:

| Phase Tag | Phase Name | Target Window | Core Focus |
| :--- | :--- | :---: | :--- |
| `[P0]` | **MVP Core** | ~10 Days | Spreadsheet replacement: self-logging in `HH:MM:SS`, live scoreboard, mandatory goals, auto-punishments, PFP download, 1-click Discord summary. |
| `[P1]` | **Automation & Integrations** | 2 Weeks | YPT API Bot automated ingestion, 24/7 `@HoldMeToItBot` Discord bot, auto-expiring countdown timers. |
| `[V1]` | **Gamification & Fair Math** | 2–3 Weeks | Overflow diminishing returns ($\alpha=0.5$), Auto-balancer snake draft (15h cap), daily challenge streaks, achievement badges, member profiles. |
| `[V2]` | **Spontaneous Duels & Scale** | 2 Weeks | Peer-to-peer 1v1 sprint duels (mutual consent, zero mod overhead), multi-guild schema readiness. |

---

## 2. Master Feature Catalog (Quick Matrix)

| Feature ID | Feature Name | Module | Phase | Target Persona |
| :--- | :--- | :--- | :---: | :--- |
| `FEAT-AUTH-01` | Discord OAuth 2.0 Authentication | Auth & Identity | `[P0]` | Participant, Admin |
| `FEAT-AUTH-02` | Public Read-Only Spectator Mode | Auth & Identity | `[P0]` | Spectator / Public |
| `FEAT-AUTH-03` | Multi-Guild Tenant Isolation | Auth & Identity | `[V2]` | System |
| `FEAT-CHAL-01` | Multi-Format Challenge Creator (Team, Duo, Solo) | Challenge Ops | `[P0]` | Admin |
| `FEAT-CHAL-02` | Host Manual Event Kickoff Trigger | Challenge Ops | `[P0]` | Admin |
| `FEAT-CHAL-03` | Automated Countdown Timer & Expiration | Challenge Ops | `[P1]` | System |
| `FEAT-CHAL-04` | Auto-Balancer Snake Draft & 15h Cap | Challenge Ops | `[V1]` | Admin |
| `FEAT-CHAL-05` | Event Lock & Freeze Final Results | Challenge Ops | `[P0]` | Admin |
| `FEAT-CHAL-06` | Duo Partner Self-Naming & Dynamic Team Identities | Challenge Ops | `[P0]` | Participant, Admin |
| `FEAT-AUDIT-01` | Append-Only Immutable System Audit Trail | Admin & Audit | `[P0]` | Admin, System |
| `FEAT-DECL-01` | Declared Target Hours (`HH:MM:SS`) | Declarations | `[P0]` | Participant |
| `FEAT-DECL-02` | Mandatory Weekly Goals Checklist | Declarations | `[P0]` | Participant |
| `FEAT-DECL-03` | Pre-Kickoff Declaration Lock | Declarations | `[P0]` | System |
| `FEAT-DECL-04` | Host Goal Unlock & Mid-Event Edit | Declarations | `[P0]` | Admin |
| `FEAT-LOG-01` | Daily Clock-Time Self-Logging (`HH:MM:SS`) | Study Logging | `[P0]` | Participant |
| `FEAT-LOG-02` | 24-Hour Single-Day Limit Validation | Study Logging | `[P0]` | System |
| `FEAT-LOG-03` | Direct YPT API Bot Ingestion Endpoint | Study Logging | `[P1]` | System / Teammate Bot |
| `FEAT-LOG-04` | Admin Inline Hours Override Grid | Study Logging | `[P0]` | Admin |
| `FEAT-LEAD-01` | Head-to-Head Live Match Scoreboard | Standings & Math | `[P0]` | All Users |
| `FEAT-LEAD-02` | Unified Roster Standings Table | Standings & Math | `[P0]` | All Users |
| `FEAT-LEAD-03` | Dynamic Daily Catch-Up Deficit Engine | Standings & Math | `[P0]` | Participant |
| `FEAT-LEAD-04` | Overflow Diminishing Returns Scoring Engine | Standings & Math | `[V1]` | System |
| `FEAT-PUN-01` | Dual-Failure Auto-Flagging Engine | Accountability | `[P0]` | System |
| `FEAT-PUN-02` | Punishment Wall & Deficit Roster | Accountability | `[P0]` | All Users |
| `FEAT-PUN-03` | Direct Punishment PFP Asset Download | Accountability | `[P0]` | Flagged Member |
| `FEAT-PUN-04` | Host Pardon / Excuse Override | Accountability | `[P0]` | Admin |
| `FEAT-PUN-05` | Hall of Accountability Historical Archive | Accountability | `[V1]` | All Users |
| `FEAT-DISC-01` | 1-Click Formatted Markdown Summary Copy | Discord Broadcaster | `[P0]` | Admin |
| `FEAT-DISC-02` | 24/7 `@HoldMeToItBot` Slash Commands | Discord Broadcaster | `[P1]` | Discord Users |
| `FEAT-DISC-03` | Automated Daily & Final Results Embeds | Discord Broadcaster | `[P1]` | Discord Channel |
| `FEAT-GAME-01` | Daily Challenge Streaks | Gamification | `[V1]` | Participant |
| `FEAT-GAME-02` | Condition-Based Achievement Badges (5 Types) | Gamification | `[V1]` | Participant |
| `FEAT-GAME-03` | Member Profile Cockpit (`/profile/[id]`) | Gamification | `[V1]` | All Users |
| `FEAT-DUEL-01` | Spontaneous 1v1 Mutual Study Sprint Duels | P2P Battles | `[V2]` | Discord Members |

---

## 3. Module Specifications: Authentication & Identity

### §3.1 Discord OAuth 2.0 Authentication `[P0]`
- **User Flow:** User visits landing page $\rightarrow$ clicks "Login with Discord" $\rightarrow$ grants `identify` scope $\rightarrow$ redirected back with session.
- **Data Captured:** Discord Snowflake ID, username, global display name, avatar URL hash.
- **Persistence:** Upserts record into `User` table; synchronizes avatar and display name on every login.
- **Access Roles:** Default role `PARTICIPANT`. First user or server admin flagged as `ADMIN`.

### §3.2 Public Read-Only Spectator Mode `[P0]`
- **User Flow:** Anyone visiting `/challenge/:id` without an active session can view the live match scoreboard, participant hours, and download the punishment PFP.
- **Security Invariant:** Write actions (logging hours, checking goals, editing rosters) are disabled and hidden for unauthenticated guests.

### §3.3 Multi-Guild Tenant Isolation `[V2]`
- **Description:** Adds optional `guild_id` to `Challenge` and `User` models, preparing the codebase to be installed across multiple independent Discord communities without data leakage.

---

## 4. Module Specifications: Challenge Operations & Lifecycle

### §4.1 Multi-Format Challenge Creator & Dynamic Identities `[P0]`
- **Route:** `/admin/challenges/new`
- **Supported Formats:**
  1. `TEAM_VS_TEAM`: Two competing named rosters.
  2. `DUOS`: Pairs of $N=2$ accountability partners.
  3. `SOLOS`: Free-for-all individual leaderboard ($N=1$).
- **Dynamic Per-Event Team Themes:**
  - Team identities are never hardcoded across challenges. Every challenge defines its own thematic team names, icons/emojis, mascot illustrations, and accent colors (e.g. *Honey Bees vs Lavender Butterflies*, *Owls vs Larks*, *Matcha vs Espresso*, *Sunflowers vs Ferns*, *Dragons vs Griffins*).
  - Configurable during event creation via the host wizard and editable prior to kickoff.
- **Configuration Fields:** Title, Start Date/Time, End Date/Time, Format, Dynamic Team Names/Colors/Mascots, Participant Assignment, Punishment PFP image URL/asset.

### §4.2 Host Manual Event Kickoff Trigger `[P0]`
- **Mechanism:** Even after the scheduled start time arrives, the host retains a "Start Event Now" button to verify all rosters and declared goals before locking inputs.
- **State Transition:** Moves challenge from `UPCOMING` to `ACTIVE`. Locks all target hours and goal descriptions.

### §4.3 Automated Countdown Timer & Expiration `[P1]`
- **Mechanism:** Background scheduler checks active challenge end timestamps.
- **Automated Transition:** When the countdown hits `00:00:00`, challenge automatically transitions to `COMPLETED`, freezes logging forms, and executes the punishment calculation routine.

### §4.4 Auto-Balancer Snake Draft & 15-Hour Cap `[V1]`
- **15-Hour Sanity Cap:** System rejects any declared target $>15\text{ hours/day}$ ($>105\text{ hours/week}$).
- **Draft Algorithm:**
  - Calculates composite rating: $R_i = 0.6 \times \text{DeclaredTarget} + 0.4 \times \text{HistoricalDailyAverage}$.
  - Sorts participants and runs a snake draft ($A, B, B, A, A, B\dots$) to produce evenly matched teams.
  - **Host Override:** Drag-and-drop roster editor lets mods swap participants before launching.

### §4.5 Event Lock & Finalize Results `[P0]`
- **Route:** `/admin/challenges/:id`
- **Action:** Host clicks "Lock Final Results". Freezes all participant data rows and triggers the final punishment evaluation.

### §4.6 Append-Only Immutable System Audit Trail `[P0]`
- **Feature ID:** `FEAT-AUDIT-01`
- **Description:** An immutable, tamper-proof audit log recording every single administrative action, manual hours adjustment, goal modification, pardon, and challenge status transition performed across the platform.
- **Invariants:**
  1. **Strict Immutability:** The audit log table and system log storage are strictly append-only. Zero `UPDATE` or `DELETE` permissions exist in the application or database layer, even for super-administrators.
  2. **Audit Envelope Structure:** Every entry records:
     - `id`: Unique identifier (CUID).
     - `timestamp`: ISO 8601 UTC timestamp.
     - `actorId`: Discord Snowflake ID of the executing admin or `SYSTEM`.
     - `actorUsername`: Cached Discord username/display name at execution time.
     - `actionType`: Enum (`HOURS_OVERRIDE`, `GOAL_EDIT`, `GOAL_UNLOCK`, `PARTICIPANT_PARDONED`, `CHALLENGE_KICKOFF`, `CHALLENGE_LOCKED`, `CHALLENGE_CREATED`).
     - `targetEntityId`: Affected row ID (e.g. log ID, participant ID).
     - `targetEntityType`: Entity type (`DAILY_STUDY_LOG`, `WEEKLY_GOAL`, `CHALLENGE`, `PARTICIPANT`).
     - `previousValue`: JSON snapshot of prior state.
     - `newValue`: JSON snapshot of updated state.
     - `auditReason`: Brief human-written reason explaining the modification.
  3. **Host Console Interface:** Streamlined 4-column timeline in the Host Console under the dedicated "Audit Trail" tab (Timestamp, Actor, Action & Details, Reason) with 1-click JSON export for offline archival. Zero unnecessary metric cards or mock bloat.

### §4.7 Duo Partner Self-Naming & Pre-Kickoff Locking `[P0]`
- **Feature ID:** `FEAT-CHAL-06`
- **Description:** In `DUOS` format events (pairs of $N=2$ accountability partners), team naming autonomy is granted directly to the participants forming each pair.
- **Rules & User Flow:**
  1. **Self-Naming Window (`UPCOMING` Phase):** When enrolled into a Duo slot during the pre-kickoff phase, either partner can input or edit their custom Duo Name (e.g., *"Caffeine & Calculus"*, *"Midnight Chai"*, *"Late-Night Bio Chemists"*).
  2. **Real-Time Synchronization:** When partner A updates the duo name, partner B sees the updated team badge immediately in their Cockpit and on the event roster.
  3. **Permanent Pre-Kickoff Lock:** Once the event host triggers kickoff (`ACTIVE`), duo team names become permanently read-only along with declared target hours and weekly goals.
  4. **Host Override Absolute (Law L5):** Community hosts retain administrative authority to rename offensive, disruptive, or duplicate duo names from `/admin/challenges/:id/roster` at any time, with all edits recorded in the audit trail (`FEAT-AUDIT-01`).

---

## 5. Module Specifications: Pre-Challenge Declarations

### §5.1 Declared Weekly Target Hours `[P0]`
- **Requirement:** Every enrolled participant enters their target hours in `HH:MM:SS` (e.g., `35h 00m 00s`) during the `UPCOMING` phase.
- **Constraint:** Minimum $1\text{ hour}$, maximum $105\text{ hours}$ per week.

### §5.2 Mandatory Weekly Goals Checklist `[P0]`
- **Requirement:** Each participant must submit between $1$ and $10$ concrete text tasks (e.g., *"Finish Organic Chemistry ch 4–6"*).
- **Hard Condition:** Every declared task must be checked off before the challenge concludes to avoid punishment.

### §5.3 Pre-Kickoff Declaration Lock `[P0]`
- **Invariant:** When the event status becomes `ACTIVE`, all targets and task descriptions become read-only for participants.

### §5.4 Host Goal Unlock & Mid-Event Edit `[P0]`
- **Purpose:** Accommodate real-life syllabus shifts or illness.
- **Action:** Admins can open any participant's goal sheet to add, edit, or unlock a task mid-challenge.

---

## 6. Module Specifications: Study Hour Ingestion & Logging

### §6.1 Daily Clock-Time Self-Logging (`HH:MM:SS`) `[P0]`
- **Route:** `/dashboard`
- **Input Fields:** Date selector + three numeric inputs: `Hours`, `Minutes`, `Seconds`.
- **Display Representation:** Stored as total integer seconds, rendered formatted as `HH:MM:SS` (matching YPT display).

### §6.2 24-Hour Single-Day Limit Validation `[P0]`
- **Rule:** Total study time logged for any single participant on any single calendar date cannot exceed $86,400\text{ seconds}$ ($24\text{ hours}$).

### §6.3 Direct YPT API Bot Ingestion Endpoint `[P1]`
- **Route:** `POST /api/v1/ingest/ypt`
- **Authentication:** Pre-shared Bearer API Token between teammate's YPT bot and web server.
- **Payload:** `{ discordId, date, durationSeconds, yptSubject }`.
- **Behavior:** Automatically upserts `DailyStudyLog` records and recalculates standings without human effort.

### §6.4 Admin Inline Hours Override Grid `[P0]`
- **Route:** `/admin/challenges/:id/roster`
- **Capability:** Full table of all member logs with inline-editable hours to fix timer crashes or disputes. Logs flagged with `is_admin_override = true`.

---

## 7. Module Specifications: Standings, Scoreboard & Calculations

### §7.1 Head-to-Head Live Match Scoreboard `[P0]`
- **Layout:** High-contrast top banner displaying dynamic team identities (e.g. *Honey Bees vs Lavender Butterflies*, *Owls vs Larks*, or top contending Duo pairs in Duos mode).
- **Metrics:** Total cumulative time (`HH:MM:SS`), leader crown icon, and lead margin delta (`+Xh Ym Zs ahead`).

### §7.2 Unified Roster Standings Table `[P0]`
- **Columns:** Rank, Participant (Avatar + Discord Handle), Team / Duo Name Tag, Total Logged (`HH:MM:SS`), Target (`HH:MM:SS`), % Completed, Goals Done ($M/N$), Status Badge (`On Track` / `At Risk`).
- **Filters:** "All", dynamic House tabs (e.g. "Team 1", "Team 2"), or Duo pair filter.

### §7.3 Dynamic Daily Catch-Up Deficit Engine `[P0]`
- **Formula:**
  $$\text{Deficit} = \max(0, \text{Target Seconds} - \text{Logged Seconds})$$
  $$\text{Required Pace / Day} = \frac{\text{Deficit}}{\text{Days Remaining}}$$
- **UI Feedback:** Displays dynamic encouragement: *"Need 3h 45m/day over next 2 days to pass target."*

### §7.4 Overflow Diminishing Returns Scoring Engine `[V1]`
- **Problem Solved:** Prevents single extreme outliers from breaking team competitive balance.
- **Dual-Credit Invariant:**
  1. **Personal Profile / Badges:** Always awards **100% full credit** for all logged hours.
  2. **Team Match Score:** Hours beyond daily target apply a half-weight damping factor ($\alpha = 0.5$):
     $$\text{If } L \le T_{\text{daily}}: \quad \text{TeamScore} = L$$
     $$\text{If } L > T_{\text{daily}}: \quad \text{TeamScore} = T_{\text{daily}} + 0.5 \times (L - T_{\text{daily}})$$

---

## 8. Module Specifications: Accountability & Punishment

### §8.1 Dual-Failure Auto-Flagging Engine `[P0]`
- **Trigger:** Evaluated automatically upon event conclusion:
  $$\text{Is Punished} = (\text{Logged Seconds} < \text{Target Seconds}) \lor (\text{Incomplete Goals} > 0)$$
- **Result:** Failed participants assigned status `PUNISHED`.

### §8.2 Punishment Wall & Deficit Roster `[P0]`
- **Display:** High-visibility section showing flagged members, their missing hours deficit, and unfinished tasks.

### §8.3 Direct Punishment PFP Asset Download `[P0]`
- **Action:** Prominent **"Download Punishment PFP"** button on the Punishment Wall. Downloads the challenge PFP directly so members don't have to hunt Discord chat channels.

### §8.4 Host Pardon / Excuse Override `[P0]`
- **Action:** Admin review modal allowing hosts to grant pardon (`EXCUSED`) with an audit reason (e.g., illness).

### §8.5 Hall of Accountability Historical Archive `[V1]`
- **Description:** Permanent record tracking total punishments incurred, target completion rate, and redemption history across past challenges.

---

## 9. Module Specifications: Discord Broadcaster & Bot

### §9.1 1-Click Formatted Markdown Summary Copy `[P0]`
- **Location:** Admin Console.
- **Action:** One-click button copies formatted Discord markdown to clipboard containing:
  - Event title & dates.
  - Final team scores & winning team announcement.
  - Individual podium (🥇, 🥈, 🥉).
  - Punishment Wall roster with Discord mentions.

### §9.2 24/7 `@HoldMeToItBot` Slash Commands `[P1]`
- **Commands:**
  - `/stats [user]`: Shows daily logged time, weekly target progress, and goal status.
  - `/standings`: Returns live team scoreboard and podium rankings.
  - `/deficit`: Displays remaining hours and required daily catch-up pace.

### §9.3 Automated Daily & Final Results Embeds `[P1]`
- **Daily Check-in:** Bot posts a 12:00 PM mid-day standings embed to `#study-announcements`.
- **Final Broadcast:** Bot automatically posts the final winner/punishment embed when the countdown timer expires.

---

## 10. Module Specifications: Gamification, Streaks & Badges

### §10.1 Daily Challenge Streaks `[V1]`
- **Rule:** Daily streak increments by 1 if a participant logs $\ge 100\%$ of their required daily target ($T_{\text{weekly}} / 7$). Resets if a challenge day ends with 0 hours.

### §10.2 Condition-Based Achievement Badges `[V1]`
| Badge Name | Icon | Trigger Condition |
| :--- | :---: | :--- |
| **Centurion** | 🏛️ | Log $\ge 100\text{ hours}$ of verified study time across challenges. |
| **Night Owl** | 🦉 | Log $\ge 30\text{ hours}$ between 10:00 PM and 4:00 AM. |
| **Flawless Grinder** | 🎯 | Complete $100\%$ of target hours AND $100\%$ of weekly goals in a challenge. |
| **Comeback Kid** | ⚡ | Overcome a $>5\text{-hour}$ deficit in the final 48 hours to meet target. |
| **Veteran** | ⚔️ | Participate in 5 completed community challenge events. |

### §10.3 Member Profile Cockpit (`/profile/[id]`) `[V1]`
- **Route:** `/profile/[id]`
- **Content:** Total lifetime hours, W/L record in team battles, current daily streak, badge showcase, and Hall of Accountability record.

---

## 11. Module Specifications: Peer-to-Peer Real-Time Features

### §11.1 Spontaneous 1v1 Mutual Study Sprint Duels `[V2]`
- **Workflow:**
  1. Member A initiates: `/duel @user duration:2h`.
  2. Member B accepts via Discord button or web notification.
  3. A temporary head-to-head sprint room is created with live countdown.
  4. Winner declared automatically when the duration expires.
  5. **Zero Admin Friction:** No moderator creation, review, or approval needed.

---

## 12. Deliberately Excluded / Rejected Features

The following features were evaluated and deliberately excluded based on user feedback:
- ❌ **Native In-Browser Study Timer (Pomodoro/Stopwatch):** Excluded because members study on diverse mobile devices where YPT is preferred.
- ❌ **In-App Virtual Study Rooms:** Excluded because community members already study inside Discord voice/video channels.
- ❌ **Automated Discord Role Assignments (Roles for Winners/Losers):** Excluded for now to avoid server role clutter.
- ❌ **Grace Passes / Freeze Days:** Excluded in favor of the pure cumulative catch-up deficit model.
