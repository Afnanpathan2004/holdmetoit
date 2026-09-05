# DESIGN.md — Visual Identity, Aesthetic & Design System

> **Project:** HoldMeToIt (Gamified Study Accountability Platform)  
> **Aesthetic Direction:** *Cozy Study Café & Late-Night Library*  
> **Status:** Ratified Baseline Design System (Adaptable to team polish)  
> **Last Updated:** 2026-09-05  

---

## 1. Creative Direction & Aesthetic Philosophy

### 1.1 The "Cozy Study Café" Vibe
Most competitive productivity and gaming apps rely on harsh, high-contrast neon accents (electric blues, piercing reds, pitch-black OLED contrasts). For long study sessions and academic accountability, this creates visual fatigue, anxiety, and guilt.

**HoldMeToIt** intentionally pivots to a **warm, cozy, focus-inducing aesthetic**:
- **Atmosphere:** Think of a quiet, rain-streaked window in a warm-lit study café, wooden desks, steaming mugs of tea, ambient lofi beats, and soft amber desk lamps.
- **Tone:** Encouraging, gentle, and disciplined. Failing to meet a target doesn't trigger blaring red sirens; it offers a calm, clear, mathematically precise path to catch up.
- **Clarity First:** While the aesthetic is warm and inviting, data density (seconds-precision clocks, team totals, goal checklists) remains crisp, scannable, and unmistakable.

```
Visual Tone Attributes:
┌──────────────────┬────────────────────────────────────────────────────────┐
│ Warmth           │ Deep roasted espresso, dark oatmeal, and soft charcoal  │
│ Encouragement    │ Golden amber accents and soft sage green completions   │
│ Precision        │ Monospace tabular clocks for HH:MM:SS precision        │
│ Comfort          │ Generous rounded curves (rounded-2xl) and soft glows   │
└──────────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Color Palette & Semantic Tokens

All colors are calibrated for high legibility (WCAG AA/AAA compliant against dark backgrounds) with warm undertones rather than cold blues or greens.

### 2.1 Core Palette

```
Surface Layers (Dark Roast & Charcoal):
  #121110 ─── Canvas / Body Background (Deep Roasted Espresso)
  #1a1816 ─── Card Surface (Dark Cocoa Slate)
  #24211e ─── Elevated Surface / Modals (Warm Hearth)
  #36312b ─── Subtle Borders & Dividers (Warm Sepia Border)

Accents & Brand Identifiers:
  #f59e0b ─── Primary Brand Amber (Warm Honey Lamp)
  #fbbf24 ─── Highlight Amber (Golden Glow / Crown)
  #d97706 ─── Active Press / Hover Amber

Semantic Status Signals:
  #10b981 ─── Muted Sage Green (On Track / Goal Completed / Passed)
  #f87171 ─── Terracotta Clay (Deficit / Catch-Up Needed / Punishment PFP)
  #a78bfa ─── Dusty Lavender (Team Duo / Secondary Rival Badge)

Text Hierarchy:
  #f5f4f0 ─── Primary Headings & High-Emphasis Text (Warm Cream)
  #d6d3cd ─── Secondary Body Text (Soft Linen)
  #a8a29e ─── Muted / Auxiliary Labels (Oatmeal Dust)
  #78716c ─── Subtle Timestamps / Inactive Placeholders (Warm Ash)
```

### 2.2 Semantic Token Mapping

| Semantic Token | Hex Value | Tailwind Token | Context / Usage |
| :--- | :--- | :--- | :--- |
| `bg-app` | `#121110` | `bg-stone-950` (warm tint) | Full viewport background |
| `bg-surface` | `#1a1816` | `bg-stone-900` | Standard cards, panels, table containers |
| `bg-surface-elevated` | `#24211e` | `bg-stone-850` | Modals, dropdowns, sticky action bars |
| `border-warm` | `#36312b` | `border-stone-800` | Card borders, table divider lines |
| `text-primary` | `#f5f4f0` | `text-stone-50` | Screen titles, participant names, clock digits |
| `text-muted` | `#a8a29e` | `text-stone-400` | Helper text, secondary stats, dates |
| `accent-amber` | `#f59e0b` | `text-amber-500` | Primary buttons, active tabs, leader crown |
| `accent-sage` | `#10b981` | `text-emerald-500` | Checked goals, "On Track" pill, positive deltas |
| `accent-terracotta`| `#f87171`| `text-rose-400` | "Catch-Up Needed" pill, hours deficit, punishment |

---

## 3. Typography System

The typography pairs a clean, humanistic sans-serif for reading comfort with a dedicated tabular monospace font for clock numbers (`HH:MM:SS`) to eliminate layout jitter.

### 3.1 Typefaces
1. **Primary Interface Sans:** `Plus Jakarta Sans`, `Geist Sans`, or `Inter`
   - *Characteristics:* Wide aperture, warm human geometry, highly legible at small sizes.
2. **Tabular Monospace (Clocks & Numbers):** `JetBrains Mono` or `Geist Mono`
   - *Characteristics:* Equal-width numbers (`tabular-nums`), distinct zero and digits, perfect clock alignment.

### 3.2 Type Scale

| Scale Role | Font Size | Line Height | Weight | Tracking | Usage |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Display / Score** | `36px` (`2.25rem`) | `1.1` | Bold (`700`) | `-0.02em` | Scoreboard total hours, leader time |
| **Heading 1 (H1)** | `28px` (`1.75rem`) | `1.2` | SemiBold (`600`) | `-0.01em` | Challenge title, main dashboard heading |
| **Heading 2 (H2)** | `20px` (`1.25rem`) | `1.3` | SemiBold (`600`) | `0em` | Card section titles ("Log Hours", "Standings") |
| **Heading 3 (H3)** | `16px` (`1.0rem`) | `1.4` | Medium (`500`) | `0em` | Modal headers, roster subheadings |
| **Body Large** | `15px` (`0.938rem`)| `1.5` | Regular (`400`) | `0em` | Goal checklist text, encouragement prompts |
| **Body Small / Meta**| `13px` (`0.812rem`)| `1.4` | Regular (`400`) | `0.01em` | Table headers, badges, timestamps |
| **Clock Monospace** | `14px–24px` | `1.0` | Medium (`500`) | `0.02em` | All `HH:MM:SS` durations & input dials |

---

## 4. Component Visual Specifications

### 4.1 Head-to-Head Live Scoreboard Banner
- **Container:** Rounded `rounded-2xl`, bordered in soft `#36312b`, with a warm ambient background gradient (`linear-gradient(135deg, #1c1917 0%, #24211e 100%)`).
- **Team Modules:** Left side (e.g. *Honey Bees* in warm amber glow), Right side (e.g. *Butterflies* in soft lavender).
- **Center Element:** Cozy circular badge displaying `VS` with a warm amber pill underneath indicating the live margin delta:
  $$\text{“Bees lead by +03h 45m 12s”}$$
- **Leader Crown:** Subtle, glowing amber crown icon (`👑`) above the leading team's cumulative total.

### 4.2 The "Cozy Hearth" Participant Cockpit
The logging experience is designed to feel as effortless as jotting a note in a leather-bound journal:
1. **Day Selector:** Horizontal chip carousel showing the 7 days of the challenge week (e.g., `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`, `Mon`) with active days highlighted in warm amber borders.
2. **Clock-Time Dial Inputs (`HH:MM:SS`):**
   - Three soft dark input boxes (`[ 04 ]h [ 30 ]m [ 00 ]s`).
   - Quick-add shortcut chips below the inputs: `[+30m]`, `[+1h]`, `[+2h]`, `[Copy Yesterday]`.
   - Clear, satisfying **"Record Study Time"** button with warm amber background and gentle scale feedback.
3. **Encouraging Dynamic Deficit Gauge:**
   - Soft circular or bar progress meter showing percentage of weekly target completed.
   - Warm human copy:
     - *On Track:* 🌿 *"You're 2h 15m ahead of pace! Keep up the serene grinding."*
     - *Catch-Up Needed:* ☕ *"Need 3h 20m/day over the next 2 days to hit your target. Totally doable."*

### 4.3 Interactive Weekly Goals Checklist
- **Tasks:** Styled as neat cards with rounded corners (`rounded-xl`).
- **Uncompleted State:** Oatmeal text with a clean empty checkbox bordered in warm sepia.
- **Completed State:** Soft strike-through text, opacity reduced to `0.65`, with an animated emerald checkmark (`✓`).
- **Counter Pill:** Small tag in header showing progress: `3 of 5 Goals Completed`.

### 4.4 Community Standings Table
- **Clean Rhythm:** Alternating subtle row backgrounds (`#1a1816` and `#1f1c19`) with comfortable `py-3.5` vertical padding.
- **Podium Styling:**
  - 🥇 1st Place: Soft warm gold background tint with amber medal icon.
  - 🥈 2nd Place: Soft warm silver tint.
  - 🥉 3rd Place: Soft bronze tint.
- **Status Badges:**
  - `On Track`: Soft emerald capsule (`bg-emerald-950/60 text-emerald-400 border border-emerald-800/40`).
  - `Needs Catch-Up`: Soft terracotta capsule (`bg-rose-950/60 text-rose-300 border border-rose-800/40`).
- **Direct Goal Progress:** Visual indicator showing fraction of mandatory tasks complete (e.g. `4/4` or `2/5`).

### 4.5 The Punishment Wall & PFP Hub
- **Purpose:** Accountability without cruelty. Playful, community-spirited aesthetic.
- **Flagged Member Cards:** Outlined in soft terracotta with avatar, missing hours deficit, and unfinished tasks clearly stated.
- **Punishment PFP Asset:** Prominent, rounded button:
  - Text: **"Download Punishment PFP"** (icon: 🖼️ / ⬇️)
  - Color: Warm terracotta accent (`bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/40`).
  - Action: Triggers instant direct browser download of the challenge's assigned profile picture.

---

## 5. Mobile Layout & Responsiveness Guidelines (360px+)

Community members frequently check standings and log hours directly from mobile phones during study breaks:

1. **Strict 360px Minimum Viewport:** Zero horizontal scrollbars under any circumstances.
2. **Touch Target Size:** All buttons, day selector pills, and checkboxes must have a minimum touch target of `44px x 44px`.
3. **Adaptive Table View:**
   - Desktop ($>768\text{px}$): Full multi-column data grid.
   - Mobile ($<768\text{px}$): Transforms seamlessly into compact, stacked participant cards displaying Avatar, Rank, Team, Total Hours, and Status Badge.
4. **Bottom Sheet Logging:** On mobile viewports, clicking "Log Hours" opens a smooth, thumb-friendly bottom drawer with the clock dials.

---

## 6. Tailwind CSS Design Token Configuration

When project scaffolding begins, the following extensions in `tailwind.config.ts` represent the ratified design tokens:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cozy: {
          bg: "#121110",
          surface: "#1a1816",
          elevated: "#24211e",
          border: "#36312b",
          cream: "#f5f4f0",
          linen: "#d6d3cd",
          oatmeal: "#a8a29e",
          ash: "#78716c",
          amber: {
            DEFAULT: "#f59e0b",
            light: "#fbbf24",
            dark: "#d97706",
          },
          sage: {
            DEFAULT: "#10b981",
            surface: "rgba(16, 185, 129, 0.12)",
          },
          terracotta: {
            DEFAULT: "#f87171",
            surface: "rgba(248, 113, 113, 0.12)",
          },
          lavender: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        cozy: "0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(245, 158, 11, 0.05)",
        "cozy-glow": "0 0 25px -4px rgba(245, 158, 11, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 7. Next Steps & Implementation Alignment

1. **Wireframe Synchronization:** The existing high-resolution mockups in `wireframe/` represent the functional baseline; their visual presentation will adapt to these warm cozy tokens during UI implementation.
2. **Review & Iteration:** Colors, spacing, and micro-interactions can be fine-tuned interactively once Next.js components are rendered in Slice 1 & Slice 3.
