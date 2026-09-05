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
│ Warmth           │ Deep roasted espresso, dark walnut, and aged parchment │
│ Encouragement    │ Candlelight honey lamp and soft dried sage completions │
│ Precision        │ Monospace tabular clocks for HH:MM:SS precision        │
│ Comfort          │ Soft paper textures, gentle curves, tactile wooden tabs │
└──────────────────┴────────────────────────────────────────────────────────┘
```

### 1.2 The "Anti-Slop" Aesthetic Invariants (Mandatory Design Guardrails)
To prevent the application from regressing into generic, overwhelming "AI slop" or loud crypto/esports dashboards, all engineers and autonomous agents must enforce these design guardrails:

| Banned "AI Slop" / SaaS Trope | Required Cozy Café Standard | Rationale |
| :--- | :--- | :--- |
| ❌ **Harsh neon glows & electric ambers** (`blur-2xl`, high-saturation neon lights) | ✅ **Muted candlelight honey (`#d9822b`)** & soft ambient vignette lighting | Neon glows cause eye strain during 4+ hour study sessions. |
| ❌ **Bouncing badges & pulsing LEDs** (`animate-bounce`, `animate-pulse` on crowns) | ✅ **Quiet, dignified typographic hierarchy** & static warm badges | Constant looping animations distract the student's peripheral vision. |
| ❌ **Badge & chip clutter on every corner** (Overlapping status tags, "PROTOTYPE" pills) | ✅ **Clean whitespace, calm padding**, and generous breathing room | Visual density without clutter. Let the workspace breathe. |
| ❌ **Alarming red emergency banners** (Loud warning boxes inducing failure panic) | ✅ **Warm pottery terracotta (`#c7634c`)** & gentle handwritten reflection notes | Study accountability is about sustainable redemption, not cruelty or shame. |
| ❌ **Esports combat styling** (Aggressive "FIGHT", "VS" deathmatch tickers) | ✅ **"The House Cup" or café noticeboard** (Chalkboard/wooden plaque motif) | Teams are study companions encouraging mutual consistency, not gladiators. |
| ❌ **Generic stock icons & flat corporate clip art** | ✅ **Bespoke warm assets** (Rainy window artwork, storybook forfeit avatars) | Tangible charm and community personality foster emotional attachment. |

---

## 2. Color Palette & Semantic Tokens

All colors are calibrated for high legibility (WCAG AA/AAA compliant against dark backgrounds) with warm organic undertones rather than cold blues, saturated neons, or sterile grays.

### 2.1 Core Palette

```
Surface Layers (Roasted Espresso & Dark Walnut):
  #12100e ─── Canvas / Body Background (Deep Roasted Espresso Bean)
  #181512 ─── Primary Desk Surface (Dark Walnut Wood)
  #1e1a16 ─── Card & Panel Surface (Warm Cocoa Slate)
  #26211c ─── Elevated Surface / Modals (Warm Hearth Mantle)
  #2f2821 ─── Subtle Dividers (Soft Sepia Border)
  #3d342b ─── Subtle Focus Border (Warm Sepia Highlight)

Accents & Brand Identifiers:
  #d9822b ─── Primary Brand Amber (Candlelight Honey Lamp)
  #ebb06e ─── Highlight Amber (Soft Golden Glow)
  #b86a1e ─── Active Press / Dark Honey

Semantic Status Signals:
  #4b8b67 ─── Dried Sage Leaves (On Track / Intention Completed / Serene Pace)
  #18271e ─── Calm Forest Tea Surface (Sage Background Tint)
  #c7634c ─── Warm Pottery Terracotta (Deficit / Catch-Up Needed / Friendly Forfeit)
  #2a1916 ─── Muted Clay Surface (Terracotta Background Tint)
  #9986b8 ─── Dried Lavender Sprigs (Secondary Team House / Companion Badge)
  #211c2b ─── Deep Dusk Surface (Lavender Background Tint)

Text Hierarchy:
  #f5f0e6 ─── Primary Headings & Reading Text (Aged Warm Parchment)
  #d8cfc4 ─── Secondary Body Text (Soft Linen)
  #9e9284 ─── Muted / Auxiliary Labels (Oatmeal Dust)
  #6e6459 ─── Subtle Timestamps / Quiet Counters (Warm Ash)
```

### 2.2 Semantic Token Mapping

| Semantic Token | Hex Value | Tailwind Token | Context / Usage |
| :--- | :--- | :--- | :--- |
| `bg-app` | `#12100e` | `bg-stone-950` (warm espresso tint) | Full viewport canvas |
| `bg-desk` | `#181512` | `bg-stone-900` (walnut tint) | Main workspace & desk panels |
| `bg-surface` | `#1e1a16` | `bg-stone-850` (cocoa tint) | Standard cards, logbooks, tables |
| `bg-surface-elevated`| `#26211c` | `bg-stone-800` (hearth tint) | Modals, elevated trays, toolbars |
| `border-warm` | `#2f2821` | `border-stone-800` | Subtle card borders, notebook lines |
| `text-primary` | `#f5f0e6` | `text-amber-50` (parchment) | Screen titles, clocks, reading text |
| `text-muted` | `#9e9284` | `text-stone-400` (oatmeal) | Helper text, secondary stats, notes |
| `accent-honey` | `#d9822b` | `text-amber-600` (honey) | Primary buttons, active tabs, leader indicator |
| `accent-sage` | `#4b8b67` | `text-emerald-600` (sage) | Checked intentions, "Serene Pace" badge |
| `accent-terracotta`| `#c7634c` | `text-rose-500` (terracotta) | "Catch-Up Needed", forfeit avatar, deficit rate |

---

## 3. Typography System

The typography pairs an artisanal, humanist literary serif (`Fraunces`) for atmospheric headings and house plaques with a warm, geometric-humanist sans (`DM Sans`) for comfortable reading and clean UI controls, a dedicated tabular monospace font (`JetBrains Mono`) for rock-solid clock numbers (`HH:MM:SS`), and a subtle handwritten script (`Caveat`) for casual study notes and marginalia.

### 3.1 Typefaces
1. **Primary Literary Serif (Headings, House Plaques & Brand):** `Fraunces` (Fallback: `Newsreader`, `Georgia`, `serif`)
   - *Characteristics:* Variable optical-sized (`opsz 9..144`) old-style soft serif. Warm, organic terminal curves, vintage letterpress rhythm, and high editorial tactile depth. Replaces generic dry serifs (`Lora`) and corporate SaaS fonts.
2. **Interface & Reading Sans (Body, Cards, Labels & Controls):** `DM Sans` (Fallback: `-apple-system`, `sans-serif`)
   - *Characteristics:* Warm geometric-humanist proportions, generous x-height, and soft friendly apertures. Highly legible in dark mode across amber and espresso cards without cold clinical sterile vibes.
3. **Tabular Monospace (Clocks, Timers & Verification Numbers):** `JetBrains Mono`
   - *Characteristics:* Equal-width tabular digits (`font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1, "zero" 1`), zero layout jump during timer updates.
4. **Handwritten Marginalia Accent (Study Notes, Stamps & Quotes):** `Caveat`
   - *Characteristics:* Natural handwriting script evoking a tutor's encouraging pencil remark or sticky note in a student's paper planner.

### 3.2 Type Scale

| Scale Role | Font Size | Font Family | Weight | Tracking | Usage |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Plaque Display** | `28px–36px` (`1.75–2.25rem`) | Serif (`Fraunces`) | SemiBold (`600`) | `-0.02em` | Welcome lounge headline, house titles |
| **Scoreboard Hours**| `24px–32px` (`1.5–2.0rem`) | Monospace | SemiBold (`600`) | `0em` | Cumulative house total hours |
| **Heading 1 (H1)** | `20px–24px` (`1.25–1.5rem`)| Serif (`Fraunces`) | SemiBold (`600`) | `-0.015em` | Section headers ("Study Desk Log", "Intentions") |
| **Heading 2 (H2)** | `15px–17px` (`0.938–1.063rem`)| Sans (`DM Sans`) | SemiBold (`600`) | `-0.01em` | Card headers, table titles |
| **Body Reading** | `13px–15px` (`0.813–0.938rem`)| Sans (`DM Sans`) | Regular (`400`) | `-0.01em` | Reflection notes, goal checklist text |
| **Handwritten Note**| `14px–18px` (`0.875–1.125rem`)| Script (`Caveat`) | Medium (`500`) | `0.02em` | Margin tips, sticky notes, tutor encouragements |
| **Auxiliary / Meta**| `10px–12px` (`0.625–0.75rem`)| Sans / Mono | Medium (`500`) | `0.02em` | Table headers, timestamps, day pills |
| **Tabular Clock** | `14px–24px` | Monospace | Medium (`500`) | `0.02em` | All `HH:MM:SS` duration inputs and logs |

---

## 4. Component Visual Specifications

### 4.1 The House Cup Matchup Plaque (Noticeboard Style)
- **Container:** Rounded `rounded-3xl` with subtle 1px border in `#2f2821`, textured like a warm walnut library plaque or café chalkboard.
- **Atmospheric Background:** Soft lofi rain-on-glass illustration (`hero_cafe.jpg`) layered under a dark walnut vignette gradient (`linear-gradient(to top, #181512 0%, rgba(24, 21, 18, 0.7) 100%)`).
- **House Modules:**
  - Left: *Honey Bees* 🐝 with candlelight honey digits (`#ebb06e`). Static "In Lead" pill.
  - Center: Quiet, dignified `vs` divider with muted lead margin delta (`+04h 12m`).
  - Right: *Lavender Butterflies* 🦋 with soft linen digits (`#d8cfc4`).
- **Anti-Slop Invariant:** Zero bouncing crowns (`animate-bounce`), zero pulsing neon borders, and zero aggressive esports combat badges.

### 4.2 The "Study Desk" Cockpit & Logbook
The logging experience is designed to feel like sitting at a quiet wooden desk with an analog clock and open leather-bound journal:
1. **Day Selector:** Horizontal row of calm wooden tabs showing weekly days (`Mon` through `Sun`). The active day is highlighted with a gentle honey border and soft elevation.
2. **Tactile Clock Dials (`HH:MM:SS`):**
   - Three soft dark walnut inset boxes (`[ 04 ] : [ 30 ] : [ 00 ]`).
   - Understated tactile quick-add chips below: `[+15m]`, `[+30m]`, `[+1h]`, `[+2h]`, `[Copy Wed]`.
   - Quiet, satisfying **"Record Today's Study Time"** button in warm candlelight honey (`#d9822b`).
3. **Gentle Deficit & Catch-Up Reflection Note:**
   - Soft dried-sage card (`#18271e` surface with `#4b8b67` border).
   - Calm, encouraging handwritten-style reflection copy:
     - *On Pace:* 🌿 *"On serene pace. You are 2h 15m ahead today. To hit your 35h target, you only need ~4h 05m/day over the remaining 3 days."*
     - *Catch-Up Needed:* ☕ *"Gentle catch-up. Need 3h 20m/day over the next 2 days to hit your target. Deficit rolls forward seamlessly."*

### 4.3 Parchment Weekly Intentions Checklist
- **Notebook Aesthetics:** Styled as clean paper notebook cards with rounded corners (`rounded-2xl`).
- **Uncompleted State:** Warm cream text with a clean empty square bordered in soft sepia.
- **Completed State:** Soft strike-through text, opacity gracefully lowered, with a serene dried-sage checkmark (`✓`).
- **Counter:** Muted header counter: `3 / 5 Finished`.

### 4.4 Study Lounge Standings Table
- **Noticeboard Rhythm:** Subtle alternating row hover states on dark walnut backgrounds with generous line-height for effortless scanning.
- **Podium Styling:**
  - 1st Place: Subtle gold numeral with warm honey text.
  - 2nd Place: Soft silver linen numeral.
  - 3rd Place: Soft oatmeal bronze numeral.
- **Pace Badges:** Muted text tags (`Serene` in sage, `Deficit (-4h)` in terracotta), avoiding screaming high-contrast capsules.

### 4.5 The Accountability Nook & Forfeits Corner
- **Purpose:** Friendly community stakes with zero cruelty or shame.
- **Forfeit Avatar Asset:** High-resolution storybook illustration (e.g. the whimsical clown bee studying atop antique books, `punishment_pfp.jpg`).
- **Download Action:** Prominent, rounded button:
  - Text: **"Download Event Avatar (.jpg)"** (icon: 🖼️ / ⬇️).
  - Color: Warm cocoa card button with subtle border hover.
  - Action: Triggers instant browser download of the assigned weekly forfeit picture.

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
        cafe: {
          bg: "#12100e",          // Deep roasted espresso bean
          wood: "#181512",        // Dark walnut study desk
          card: "#1e1a16",        // Warm cocoa board
          elevated: "#26211c",    // Warm hearth mantle
          border: "#2f2821",      // Soft sepia divider
          borderLight: "#3d342b", // Subtle focus border
          parchment: "#f5f0e6",   // Aged warm cream reading text
          linen: "#d8cfc4",       // Soft secondary linen text
          oatmeal: "#9e9284",     // Muted note text
          ash: "#6e6459",         // Quiet timestamp text
          honey: {
            DEFAULT: "#d9822b",   // Candlelight honey lamp (muted, non-neon)
            light: "#ebb06e",     // Soft amber glow
            dark: "#b86a1e",
          },
          sage: {
            DEFAULT: "#4b8b67",   // Dried sage leaves
            surface: "#18271e",   // Calm forest tea surface tint
          },
          terracotta: {
            DEFAULT: "#c7634c",   // Warm pottery terracotta
            surface: "#2a1916",   // Muted clay surface tint
          },
          lavender: {
            DEFAULT: "#9986b8",   // Dried lavender sprigs
            surface: "#211c2b",   // Deep dusk surface tint
          },
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Lora", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        cafe: "0 8px 30px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
        "amber-subtle": "0 0 20px -3px rgba(217, 130, 43, 0.15)",
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
