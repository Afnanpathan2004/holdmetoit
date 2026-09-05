# HoldMeToIt ⚡

> **Gamified Study Accountability & Challenge Management Platform**  
> Replacing manual Discord spreadsheets, YPT screenshot tracking, and host burnout with an automated challenge engine.

---

## 🎯 Overview & Mission

Study challenges in Discord communities (running weekly team accountability duels, productivity sprints, and study seasons) suffer from severe **Admin Burnout**. Community moderators spend 5–10 hours every week manually building complex spreadsheets, copy-pasting YPT daily timestamps across 20+ columns, calculating team hour differences, verifying individual to-do goals, and enforcing server Punishment PFPs.

**HoldMeToIt** automates the entire lifecycle of Discord study battles:
- **Instant Challenge Setup:** Hosts configure battle cycles (e.g. Tuesday–Monday), team rosters, and punishment rules in minutes.
- **Declared Individual Targets & Weekly Goals:** Each participant declares their own weekly study-hour target (e.g. 20h, 35h, 50h, 70h) and mandatory weekly goals in the pre-kickoff phase.
- **Clock-Time Self-Logging (`HH:MM:SS`):** Instant daily logging matching Yeolpumta (YPT) clock displays down to the second with a 24-hour daily safety limit.
- **The Catch-Up Deficit Engine:** Zero grace days. Missed hours dynamically roll over into remaining challenge days with real-time pace guidance.
- **Team vs Team Match Scoreboard:** Live head-to-head banner (e.g., *Bees vs Butterflies*), lead delta (`+Xh Ym Zs ahead`), and unified standings table.
- **Dual-Failure Accountability & Punishment PFP:** Automatic flagging if hours or goals fail, paired with a direct 1-click **Download Punishment PFP** button.
- **Discord Integration:** Frictionless Discord OAuth login with public read-only spectator mode and a 1-click formatted markdown summary copy generator for hosts.

---

## 🛠️ Ratified Technology Stack

The technology stack is locked to guarantee high velocity, zero CORS overhead, and strict end-to-end type safety:

| Layer / Role | Ratified Technology | Architectural Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) | Unified fullstack SSR/Client architecture, zero CORS, edge-ready |
| **Language** | TypeScript 5.x (`strict: true`) | End-to-end type safety across DB, API, and UI |
| **Styling & Theme** | Tailwind CSS + shadcn/ui | Cozy Study Café theme (`DESIGN.md`), responsive down to 360px |
| **Database Engine** | PostgreSQL (Supabase / Neon) | Relational integrity for challenges, teams, and daily logs |
| **ORM & Migrations** | Prisma ORM 5.x | Declarative schemas, type-safe queries, migration control |
| **Authentication** | Auth.js (NextAuth.js v5) | Discord OAuth 2.0 (`identify` scope), spectator fallback |
| **Testing & Math** | Vitest | Fast ESM runner for pure domain time math and deficit logic |
| **Validation** | Zod 3.x | Strict runtime payload validation at API boundaries |

---

## 📚 Core Documentation Suite (Sources of Truth)

The project maintains a lean, highly focused 5-document suite:

| Document | Primary Authority & Purpose |
| :--- | :--- |
| **[FEATURES.md](FEATURES.md)** | Absolute source of truth for **product behavior, screen layouts, UX flows, and phase tags** (`[P0]` to `[V2]`). |
| **[DESIGN.md](DESIGN.md)** | Absolute source of truth for **visual identity, cozy theme, color tokens, typography, and mobile responsive rules**. |
| **[AGENTS.md](AGENTS.md)** | Absolute source of truth for **agent protocol, locked stack, stack laws L1–L9, git safety, and quality matrix**. |
| **[ROADMAP.md](ROADMAP.md)** | Product and technical evolution trajectory across phases (`[P0]` MVP $\rightarrow$ `[P1]` $\rightarrow$ `[V1]` $\rightarrow$ `[V2]`). |
| **[README.md](README.md)** | Developer onboarding, mission overview, locked stack matrix, and local dev setup. |

*(Historical background specifications and legacy plans are safely preserved under [`.archive/`](.archive/)).*

---

## 👥 Engineering Roles & Responsibilities

| Role | Primary Layer Responsibilities |
| :--- | :--- |
| **Data & Identity** | Database schema, Prisma migrations, Auth.js Discord OAuth, session hydration, and repositories. |
| **Scoring & Engine** | Pure domain math, `HH:MM:SS` duration converters, team score aggregations, catch-up deficit calculator, Vitest suite. |
| **Participant UI** | Student cockpit views, `HH:MM:SS` duration self-logging input, interactive weekly goal checklist, mobile responsiveness (360px+). |
| **Admin Operations** | Host wizard, team balancer & roster editor, admin inline hours override grid, challenge lock controls, 1-click Discord summary generator. |

---

## 🚀 Getting Started (Once Scaffolded)

### 1. Prerequisites
- Node.js 18.17+ or 20.x
- A free [Supabase](https://supabase.com/) or Neon PostgreSQL database
- A [Discord Developer Portal](https://discord.com/developers/applications) application for OAuth 2.0

### 2. Environment Setup
```bash
# Clone the repository
git clone https://github.com/your-org/hold-me-to-it.git
cd hold-me-to-it

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### 3. Local Development
```bash
# Run database migrations
npx prisma db push

# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
