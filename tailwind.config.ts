import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          foreground: "hsl(var(--ink-foreground))",
        },
        brand: {
          cyan: "hsl(var(--brand-cyan))",
          mint: "hsl(var(--brand-mint))",
          orange: "hsl(var(--brand-orange))",
          pink: "hsl(var(--brand-pink))",
          coral: "hsl(var(--brand-coral))",
          blue: "hsl(var(--brand-blue))",
          ink: "hsl(var(--brand-ink))",
          paper: "hsl(var(--brand-paper))",
        },
        category: {
          tutorials: "hsl(var(--category-tutorials))",
          recipes: "hsl(var(--category-recipes))",
          education: "hsl(var(--category-education))",
          memes: "hsl(var(--category-memes))",
          music: "hsl(var(--category-music))",
          culture: "hsl(var(--category-culture))",
        },
      },
      borderRadius: {
        none: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "0px",
      },
      boxShadow: {
        sm: "0 2px 4px rgba(0, 0, 0, 0.08)",
        md: "0 4px 8px rgba(0, 0, 0, 0.12)",
        lg: "0 8px 16px rgba(0, 0, 0, 0.16)",
        xl: "0 12px 24px rgba(0, 0, 0, 0.2)",
        "sm-dark": "0 2px 4px rgba(0, 0, 0, 0.3)",
        "md-dark": "0 4px 8px rgba(0, 0, 0, 0.4)",
        "lg-dark": "0 8px 16px rgba(0, 0, 0, 0.5)",
        "xl-dark": "0 12px 24px rgba(0, 0, 0, 0.6)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pop: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "50%": { transform: "translateY(-8px) scale(1.18)", opacity: "1" },
          "100%": { transform: "translateY(-14px) scale(0.98)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pop: "pop 700ms ease-out both",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
