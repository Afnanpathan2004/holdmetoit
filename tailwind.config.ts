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
        cafe: {
          bg: "#12100e",
          wood: "#181512",
          card: "#1e1a16",
          elevated: "#26211c",
          border: "#2f2821",
          borderLight: "#3d342b",
          parchment: "#f5f0e6",
          linen: "#d8cfc4",
          oatmeal: "#9e9284",
          ash: "#6e6459",
          honey: {
            DEFAULT: "#d9822b",
            light: "#ebb06e",
            dark: "#b86a1e",
          },
          sage: {
            DEFAULT: "#4b8b67",
            surface: "#18271e",
          },
          terracotta: {
            DEFAULT: "#c7634c",
            surface: "#2a1916",
          },
          cinnamon: {
            DEFAULT: "#c87948",
            surface: "#271c14",
          },
          lavender: {
            DEFAULT: "#9986b8",
            surface: "#211c2b",
          },
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        script: ["var(--font-script)", "cursive"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        cafe: "0 8px 30px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
        "amber-subtle": "0 0 20px -3px rgba(217, 130, 43, 0.15)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
