import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2rem",
        xl: "2rem",
        "2xl": "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        // ── Brand tokens ──
        gold: {
          50:  "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#EFBF04",
          500: "#D4AF37",
          600: "#B8962E",
          700: "#927523",
          800: "#78601d",
          900: "#5c491a",
          DEFAULT: "#D4AF37",
        },
        dark: {
          700: "#333333",
          800: "#1a1a1a",
          900: "#0d0d0d",
          DEFAULT: "#333333",
        },
      },

      borderRadius: {
        none:    "0",
        sm:      "0.5rem",
        DEFAULT: "0.875rem",
        md:      "0.875rem",
        lg:      "1rem",
        xl:      "1.25rem",
        "2xl":   "1.5rem",
        "3xl":   "2rem",
        full:    "9999px",
      },

      fontFamily: {
        sans: [
          "Montserrat",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        serif: [
          "Cormorant Garamond",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        display: [
          "Cormorant Garamond",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },

      boxShadow: {
        "2xs":     "var(--shadow-2xs)",
        xs:        "var(--shadow-xs)",
        sm:        "var(--shadow-sm)",
        DEFAULT:   "var(--shadow)",
        md:        "var(--shadow-md)",
        lg:        "var(--shadow-lg)",
        xl:        "var(--shadow-xl)",
        "2xl":     "var(--shadow-2xl)",
        "gold-sm": "var(--shadow-gold-sm)",
        gold:      "var(--shadow-gold)",
        "gold-lg": "var(--shadow-gold-lg)",
        inner:     "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
        none:      "none",
      },

      letterSpacing: {
        tighter:        "-0.05em",
        tight:          "-0.025em",
        normal:         "0em",
        wide:           "0.025em",
        wider:          "0.05em",
        widest:         "0.1em",
        luxury:         "0.08em",
        "luxury-wide":  "0.15em",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "gold-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,175,55,0)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(212,175,55,0.15)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.4s ease forwards",
        "fade-in-up":     "fade-in-up 0.5s ease forwards",
        "gold-pulse":     "gold-pulse 2s ease infinite",
        shimmer:          "shimmer 1.5s ease infinite",
      },

      screens: {
        xs:    "375px",
        sm:    "640px",
        md:    "768px",
        lg:    "1024px",
        xl:    "1280px",
        "2xl": "1400px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
