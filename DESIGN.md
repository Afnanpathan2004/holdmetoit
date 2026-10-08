# DESIGN.md — Visual Identity, Aesthetic & Design System

> **Project:** HoldMeToIt (Gamified Study Accountability Platform)  
> **Aesthetic Direction:** _Obsidian Dark & Clean Minimalist Gaming_ (Ratified in Figma Alignment Overhaul)  
> **Status:** Ratified Active Design System  
> **Last Updated:** 2026-10-06

---

## 1. Creative Direction & Aesthetic Philosophy

### 1.1 The Obsidian Dark Aesthetic

HoldMeToIt utilizes a sleek, dark **Obsidian aesthetic** engineered for deep focus, clean data density, and long study sessions without ocular fatigue.

- **Atmosphere:** Pitch-dark ambient workspaces (`#0d0d0d`), subtle slate card elevations (`#141414`, `#1c1c1c`), crisp contrasting typography (`#f4f3f6`), and refined house accent colors.
- **Tone:** Focused, modern, competitive yet encouraging.
- **Clarity First:** Monospace tabular numbers (`HH:MM:SS`), scannable split-share progress bars, distinct house tags, and zero layout shift.

```
Visual Tone Hierarchy:
┌──────────────────┬────────────────────────────────────────────────────────┐
│ Canvas Base      │ Deep Obsidian Charcoal (#0d0d0d)                      │
│ Surfaces         │ Obsidian Slate Cards (#141414), Elevated Trays (#1c1c1c)│
│ Accents          │ Vibrant emerald (#22c55e), azure (#3b82f6), purple     │
│ Precision        │ Monospace tabular digits for HH:MM:SS durations        │
│ Geometry         │ Squircles & pill buttons, 12px (0.75rem) - 20px radii  │
└──────────────────┴────────────────────────────────────────────────────────┘
```

### 1.2 Anti-Slop & Quality Guardrails

All UI components adhere to strict anti-slop guidelines:

- ❌ **No blinding neon glows or heavy blurs:** Keep contrast sharp with 1px border definitions (`border-[#292929]`).
- ❌ **No distracting looping animations:** Use static badges and purposeful transitions (`transition-all duration-200`).
- ❌ **No layout shift on clocks:** Enforce `tabular-nums` monospace numbers for all second-level durations.
- ❌ **No horizontal overflow on 360px:** Responsive stacking and card conversions are mandatory across all views.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Core Obsidian Palette

```
Canvas & Surfaces:
  #0d0d0d ─── Canvas Background (obsidian-bg)
  #141414 ─── Standard Card Surface (obsidian-card)
  #1c1c1c ─── Elevated Surfaces & Modals (obsidian-elevated)
  #292929 ─── Nested Panels & Borders (obsidian-nested / obsidian-border)
  #434343 ─── Highlight Borders & Focus Rings (obsidian-borderLight)
  #545454 ─── Input Fields Background (obsidian-input)

Text Hierarchy:
  #f4f3f6 ─── Primary Headings & Bold Digits (obsidian-text)
  #d1d1d1 ─── Secondary Body Text (obsidian-textMuted)
  #868686 ─── Auxiliary Meta, Timestamps, Labels (obsidian-textDim)
```

### 2.2 Dynamic House Themes

Every challenge supports customizable team themes with semantic presets:

| House Preset          | Background (`bg`) | Border (`border`) | Text (`text`) | Accent Context                 |
| :-------------------- | :---------------- | :---------------- | :------------ | :----------------------------- |
| **Serpents / Forest** | `#144520`         | `#22c55e`         | `#85ff93`     | On-track pace, positive margin |
| **Raven / Azure**     | `#102d40`         | `#3b82f6`         | `#85d6ff`     | Secondary house, neutral badge |
| **Purple / Dusk**     | `#230e40`         | `#8b5cf6`         | `#a29dae`     | Tertiary house, companion tag  |
| **Crimson / Forfeit** | `#401010`         | `#ef4444`         | `#ff5757`     | Deficit pace, punishment alert |

---

## 3. Typography System

### 3.1 Typefaces

1. **Primary Interface Sans:** `Inter` (`--font-sans`, Tailwind `font-sans`)
   - Clean, geometric clarity for navigation, body text, form controls, and table data.
2. **Display & Headings:** `Outfit` (`--font-display`, Tailwind `font-display`)
   - Expressive, modern geometric display font for large section headers, banner titles, and hero titles.
3. **Tabular Monospace Clocks:** Monospace with `tabular-nums`
   - Rock-solid digit alignment (`font-variant-numeric: tabular-nums`) preventing jumping during time calculations.

### 3.2 Type Scale

| Role              |    Size     |   Family    |      Weight      |    Tracking    | Usage                                     |
| :---------------- | :---------: | :---------: | :--------------: | :------------: | :---------------------------------------- |
| **Hero Title**    | `28px–36px` |  `Outfit`   |   Bold (`700`)   |   `-0.02em`    | Challenge hero banner title               |
| **Section Title** | `20px–24px` |  `Outfit`   | SemiBold (`600`) |   `-0.015em`   | Admin headers, section headings           |
| **Card Header**   | `15px–17px` |   `Inter`   | SemiBold (`600`) |   `-0.01em`    | Cockpit card titles, dialog titles        |
| **Body Reading**  | `13px–15px` |   `Inter`   | Regular (`400`)  |    `normal`    | Task titles, reflection notes, table text |
| **Meta / Pill**   | `10px–12px` |   `Inter`   |  Medium (`500`)  |    `0.02em`    | Status badges, timestamps, tags           |
| **Tabular Clock** | `14px–28px` | Mono / Sans | SemiBold (`600`) | `tabular-nums` | `HH:MM:SS` duration inputs and logs       |

---

## 4. Component Visual Specifications

### 4.1 Challenge Hero Banner

- **Container:** High-resolution event image with `66%` dark vignette overlay (`bg-black/66`), rounded corners (`rounded-2xl sm:rounded-3xl`).
- **Header Elements:**
   - Dynamic status badge: `UPCOMING` (amber), `ACTIVE` (emerald), `COMPLETED` (purple).
   - Countdown ticker displaying days/hours remaining.
   - In-place modal trigger for "Enroll in Challenge".
   - Secondary "Rules & Info" button.

### 4.2 Home Cockpit Banner (7 Dynamic Variants)

- **Engine:** `cockpit-banner.ts` dynamically evaluates participant state:
   1. `NOT_ENROLLED_HAS_ACTIVE`: Hero banner prompting enrollment in ongoing battle.
   2. `NOT_ENROLLED_HAS_UPCOMING`: Teaser for upcoming season.
   3. `ACTIVE_LOGGED_TODAY`: Serene completion state with positive reinforcement.
   4. `ACTIVE_NEEDS_LOG`: Urgent prompt to log hours for today.
   5. `ACTIVE_IN_DEFICIT`: Motivational catch-up banner with required daily pace.
   6. `UPCOMING_ENROLLED`: Pre-kickoff countdown reminder.
   7. `NO_CHALLENGES`: Clean empty state encouraging host creation.

### 4.3 Daily Hours Modal (`HH:MM:SS`)

- **Relative Day Buckets:** Toggles between "Today" and "Yesterday" with server-side UTC date resolution.
- **Preset Quick Chips:** Tactile increments (`+15m`, `+30m`, `+1h`, `+2h`).
- **Clock Inputs:** Tabular inputs for hours, minutes, and seconds, pre-filled with committed hours or current logged values.

### 4.4 Standings: Desktop Table vs Mobile Cards

- **Desktop ($\ge 640\text{px}$):** Full multi-column table (`Rank`, `Participant`, `Team`, `Total Hours`, `Today's Hours`, `Target`, `Status`).
- **Mobile ($< 640\text{px}$):** Transforms into stacked obsidian cards (`rounded-2xl border border-[#262626] p-3`):
   - Line 1: Rank badge, avatar, participant display name with team pill badge.
   - Line 2: Total logged vs target (`{totalLoggedClock}/{targetClock}`), with today's logged hours in vibrant green (`+{todayLoggedClock}`).

### 4.5 Offline Task Board (Daily & Weekly Checklists)

- **Layout:** Side-by-side or stacked Daily and Weekly columns with category groupings.
- **Drag & Drop:** Elevated floating card feedback, custom HTML5 drag previews, and instant 0ms IndexedDB reordering.

---

## 5. Mobile Layout & Responsiveness (360px+)

1. **Strict 360px Viewport Guard:** Zero horizontal overflow across all views (`min-w-0`, `truncate`, `overflow-x-auto`).
2. **Touch Target Size:** Interactive controls, pills, and inputs maintain a minimum touch target of `44px x 44px`.
3. **Adaptive Header:** Top navigation collapses the "Sign Out" text to a square icon button on mobile, preventing header clipping.

---

## 6. Tailwind CSS Token Configuration (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
            obsidian: {
               bg: "#0d0d0d",
               card: "#141414",
               elevated: "#1c1c1c",
               nested: "#292929",
               input: "#545454",
               inputBorder: "#484848",
               border: "#292929",
               borderLight: "#434343",
               text: "#f4f3f6",
               textMuted: "#d1d1d1",
               textDim: "#868686",
               serpents: {
                  bg: "#144520",
                  border: "#22c55e",
                  text: "#85ff93",
               },
               raven: {
                  bg: "#102d40",
                  border: "#3b82f6",
                  text: "#85d6ff",
               },
               purple: {
                  bg: "#230e40",
                  border: "#8b5cf6",
                  text: "#a29dae",
               },
               crimson: {
                  bg: "#401010",
                  border: "#ef4444",
                  text: "#ff5757",
               },
            },
         },
         fontFamily: {
            sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
            display: ["var(--font-display)", "Outfit", "Inter", "sans-serif"],
         },
         borderRadius: {
            lg: "var(--radius)",
            md: "calc(var(--radius) - 2px)",
            sm: "calc(var(--radius) - 4px)",
            "2xl": "1rem",
            "3xl": "1.5rem",
         },
         boxShadow: {
            obsidian:
               "0 8px 30px -4px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
         },
      },
   },
   plugins: [tailwindcssAnimate],
};

export default config;
```
