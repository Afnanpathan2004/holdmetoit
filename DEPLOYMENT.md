# HoldMeToIt — Production Deployment & Operator Manual

> **Document Type:** Production Deployment & Infrastructure Runbook  
> **Target Audience:** Engineering Leads, DevOps Operators, and Community Hosts  
> **Reference Stack:** Next.js 14+ (App Router), Prisma ORM, PostgreSQL (Supabase/Neon), Auth.js (Discord OAuth 2.0), Vercel  
> **Last Updated:** 2026-09-07  

---

## 1. Production Architecture Overview

```mermaid
flowchart TD
    User["Discord Community Member / Guest"] -->|HTTPS| Vercel["Vercel Edge / Serverless<br/>Next.js 14 App Router"]
    Vercel -->|OAuth 2.0 (identify)| Discord["Discord Developer API"]
    Vercel -->|Prisma ORM (Pooled URI: Port 6543)| Postgres["PostgreSQL Engine<br/>(Supabase / Neon / RDS)"]
    Admin["Host / Administrator"] -->|Admin Cockpit / Roster / Lock| Vercel
    Admin -->|Copy Markdown Summary| DiscordGuild["#study-announcements (Discord)"]
```

---

## 2. Production Environment Variables Matrix

The following environment variables must be configured in your production hosting platform (e.g. Vercel Project Settings $\rightarrow$ Environment Variables):

| Variable | Required? | Category | Purpose | Where Obtained |
| :--- | :---: | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | Persistence | PostgreSQL connection URI for Prisma ORM. | Supabase / Neon project settings (use pooled string for serverless). |
| `AUTH_SECRET` | **Yes** | Security | 32-byte encryption key for session cookies and CSRF tokens. | Generated via `openssl rand -base64 32` or `npx auth secret`. |
| `AUTH_DISCORD_ID` | **Yes** | Identity | Discord OAuth 2.0 Application Client ID. | [Discord Developer Portal](https://discord.com/developers/applications) $\rightarrow$ Application $\rightarrow$ OAuth2. |
| `AUTH_DISCORD_SECRET` | **Yes** | Identity | Discord OAuth 2.0 Application Client Secret. | [Discord Developer Portal](https://discord.com/developers/applications) $\rightarrow$ Application $\rightarrow$ OAuth2. |
| `AUTH_TRUST_HOST` | Recommended | Networking | Explicitly trust reverse-proxy host headers (`true`). | Set to `true` in Vercel environment variables. |
| `NEXT_PUBLIC_APP_URL` | Optional | Client | Canonical production URL for public links and metadata. | Your production domain (e.g. `https://holdmetoit.vercel.app`). |
| `NODE_ENV` | Default | Runtime | Node.js execution environment (`production`). | Automatically set by Vercel. |

> [!CAUTION]
> **Zero Credential Exposure:** Never commit `.env` or `.env.local` files to Git. All secrets must be injected securely via your hosting provider's dashboard or CLI secret manager.

---

## 3. Step-by-Step Infrastructure Provisioning

### Step 3.1: PostgreSQL Database Setup

HoldMeToIt requires a standard PostgreSQL 15+ database with support for standard SQL types and relational foreign keys.

#### Option A: Supabase (Recommended)
1. Navigate to [Supabase](https://supabase.com/) and create a new project.
2. Select your project region nearest to your Vercel deployment region.
3. In your Supabase Dashboard:
   - Go to **Project Settings** $\rightarrow$ **Database**.
   - Under **Connection string**, select **URI**.
   - Switch mode from **Session** to **Transaction** (Port `6543`) for serverless query efficiency:
     ```text
     postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - Copy this string as your `DATABASE_URL`.
4. *Direct Migration Connection:* For running migrations, note the direct connection (Port `5432`):
   ```text
   postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```

#### Option B: Neon PostgreSQL
1. Navigate to [Neon](https://neon.tech/) and create a project.
2. From the project dashboard, copy the connection string.
3. Enable the **Connection Pooling** checkbox (adds `-pooler` to the hostname).
4. Use the pooled connection string as your `DATABASE_URL`.

---

### Step 3.2: Discord Developer Portal Setup

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and name it (e.g. `HoldMeToIt`).
3. Under **General Information**, upload an application icon (optional).
4. Navigate to the **OAuth2** tab:
   - Copy the **Client ID** $\rightarrow$ assign to `AUTH_DISCORD_ID`.
   - Click **Reset Secret** and copy the **Client Secret** $\rightarrow$ assign to `AUTH_DISCORD_SECRET`.
5. Under **Redirects**, click **Add Redirect** and add your production callback URLs:
   - For Vercel production domain:
     ```text
     https://[YOUR-PROJECT].vercel.app/api/auth/callback/discord
     ```
   - For custom domains (if using one):
     ```text
     https://[YOUR-DOMAIN].com/api/auth/callback/discord
     ```
   - For local development:
     ```text
     http://localhost:3000/api/auth/callback/discord
     ```
6. Click **Save Changes**.

---

### Step 3.3: Database Migrations Deployment

Before users access the application, execute the initial database migration to create all tables, indexes, and enums:

```bash
# Set your DATABASE_URL in your environment or CLI
export DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Deploy migrations to the target database
npm run db:migrate:deploy
# Or directly via Prisma CLI:
# npx prisma migrate deploy
```

#### Verification:
Verify migration status:
```bash
npm run db:migrate:status
```
Expected output:
```text
Database schema is up to date!
```

#### Optional Database Seeding:
To populate an initial test challenge (*Bees vs Butterflies*):
```bash
npm run db:seed
```

---

### Step 3.4: Vercel Deployment Setup

1. Push your branch to GitHub (e.g., `main` or `afnan`).
2. Log in to [Vercel](https://vercel.com/) and click **Add New** $\rightarrow$ **Project**.
3. Import your `holdmetoit` GitHub repository.
4. In the configuration screen:
   - **Framework Preset:** Next.js (automatically detected).
   - **Root Directory:** `./` (default).
   - **Build Command:** `prisma generate && next build` (defined in `package.json`).
   - **Install Command:** `npm install` (triggers `postinstall: prisma generate`).
5. In the **Environment Variables** section, add:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `AUTH_SECRET`: Your generated 32-byte secret (`openssl rand -base64 32`).
   - `AUTH_DISCORD_ID`: Discord application Client ID.
   - `AUTH_DISCORD_SECRET`: Discord application Client Secret.
   - `AUTH_TRUST_HOST`: `true`
   - `NEXT_PUBLIC_APP_URL`: `https://[YOUR-PROJECT].vercel.app`
6. Click **Deploy**.
7. Vercel will build and deploy the application in $<90\text{ seconds}$.

---

## 4. Production Smoke-Test Checklist

Once the production deployment URL is live, the operator must execute this step-by-step verification checklist:

### Phase 1: Infrastructure & Health
- [ ] **HTTP 200 on Root:** Navigate to `https://[YOUR-DOMAIN]/` — The Cozy Study Café lounge renders cleanly.
- [ ] **No Console / Serverless Errors:** Inspect browser DevTools console and Vercel Runtime Logs for unexpected runtime crashes.
- [ ] **Prisma Connection:** Visit a challenge URL (e.g. `/challenge/[id]` if seeded) — Database queries succeed without connection timeouts.

### Phase 2: Authentication & RBAC (Journey J1)
- [ ] **Public Spectator Mode:** Open an incognito browser window and navigate to `/challenge/[id]`. Standings, banner, and house scores render in read-only mode with a "Login with Discord" CTA.
- [ ] **Discord OAuth Flow:** Click "Login with Discord". User is redirected to `discord.com/oauth2/authorize` requesting only the `identify` scope.
- [ ] **Session & Profile Sync:** After authorizing, user is redirected to `/dashboard`. Display name, Discord username, and avatar URL are displayed.
- [ ] **First User Admin Promotion:** The first user to log in is automatically assigned role `ADMIN` (`promoteFirstUserToAdminIfNeeded`).

### Phase 3: Challenge Operations (Journeys J2 & J3)
- [ ] **Admin Wizard Access:** Authenticated admin visits `/admin/challenges/new`.
- [ ] **Challenge Creation:** Create a `TEAM_VS_TEAM` challenge (*Owls vs Larks*) with start/end timestamps and custom team colors. Challenge status is `UPCOMING`.
- [ ] **Declaration Submission:** Enrolled participant enters target hours (`35:00:00`) and 3 weekly goals, then saves.
- [ ] **Kickoff Locking:** Host clicks "Start Event Now". Challenge status transitions to `ACTIVE`. Participant declaration inputs become read-only (`disabled`).

### Phase 4: Daily Logging & Dynamic Catch-Up (Journey J4)
- [ ] **Self-Logging:** Participant logs study duration (e.g. `04:30:00`) on `/dashboard`.
- [ ] **Deficit Gauge:** Catch-up deficit indicator updates dynamically with required daily pace.
- [ ] **Scoreboard Re-aggregation:** Match banner on `/challenge/[id]` immediately reflects the added time and updates the lead margin delta.

### Phase 5: Admin Manual Override & Audit (Journey J5)
- [ ] **Roster Grid:** Host visits `/admin/challenges/[id]/roster`.
- [ ] **Hours Adjustment:** Host edits an entry from `00:00:00` to `02:00:00` with reason: `"Timer crash verified via screenshot"`.
- [ ] **Audit Trail:** Verify in `/admin/challenges/[id]` that an immutable `AuditLog` entry is displayed under the audit tab.

### Phase 6: Event Finalization & Discord Broadcaster (Journey J6)
- [ ] **Lock Event:** Host clicks "Lock Final Results". Challenge transitions to `COMPLETED`.
- [ ] **Dual-Failure Punishment:** Unfinished goals or missed hours trigger `PUNISHED` status.
- [ ] **Punishment PFP:** The Punishment Wall renders with the **"Download Event Avatar"** button.
- [ ] **1-Click Discord Summary:** Host clicks "Copy Discord Summary". Paste into a test Discord channel to verify rich markdown embed formatting.

---

## 5. Troubleshooting Common Production Pitfalls

| Issue | Symptom / Error | Root Cause & Resolution |
| :--- | :--- | :--- |
| **Untrusted Host** | `[auth][error] UntrustedHost: Host must be trusted` | Missing `AUTH_TRUST_HOST=true`. Ensure `trustHost: true` is enabled in `core/auth/index.ts` and set `AUTH_TRUST_HOST=true` in Vercel. |
| **Invalid OAuth Callback** | `Invalid OAuth2 redirect_uri` on Discord | The callback URL in Vercel does not match the Discord Developer Portal. Ensure `https://[DOMAIN]/api/auth/callback/discord` is listed under **OAuth2 $\rightarrow$ Redirects**. |
| **Connection Exhaustion** | `FATAL: remaining connection slots are reserved` | Serverless lambdas opening direct connections. Switch `DATABASE_URL` to Supabase Transaction Pooler (Port `6543` with `?pgbouncer=true`) or Neon pooled connection. |
| **Advisory Lock Failure** | `P3009: migrate found failed migrations` | Running migrations through PgBouncer in transaction mode. Use direct connection (Port `5432`) when running `npm run db:migrate:deploy`. |
| **Missing Secret** | `[auth][error] MissingSecret` | `AUTH_SECRET` is not set in production. Generate one via `openssl rand -base64 32` and paste into Vercel environment variables. |

