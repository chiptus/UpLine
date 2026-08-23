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
      padding: "2rem",
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
        "subtle-foreground": "hsl(var(--subtle-foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          active: "hsl(var(--surface-active))",
        },
        paper: {
          background: "hsl(var(--paper-background))",
          foreground: "hsl(var(--paper-foreground))",
          "muted-foreground": "hsl(var(--paper-muted-foreground))",
          border: "hsl(var(--paper-border))",
        },
        live: {
          DEFAULT: "hsl(var(--live))",
          foreground: "hsl(var(--live-foreground))",
        },
        notice: {
          DEFAULT: "hsl(var(--notice))",
          foreground: "hsl(var(--notice-foreground))",
        },
        vote: {
          must: {
            DEFAULT: "hsl(var(--vote-must))",
            foreground: "hsl(var(--vote-must-foreground))",
            soft: "hsl(var(--vote-must-soft))",
          },
          interested: {
            DEFAULT: "hsl(var(--vote-interested))",
            foreground: "hsl(var(--vote-interested-foreground))",
            soft: "hsl(var(--vote-interested-soft))",
          },
          skip: {
            DEFAULT: "hsl(var(--vote-skip))",
            foreground: "hsl(var(--vote-skip-foreground))",
            soft: "hsl(var(--vote-skip-soft))",
          },
        },
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
          hover: "hsl(var(--accent-hover))",
          soft: "hsl(var(--accent-soft))",
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
        app: {
          "gradient-from": "hsl(var(--app-gradient-from))",
          "gradient-to": "hsl(var(--app-gradient-to))",
          primary: "hsl(var(--app-primary))",
          "primary-foreground": "hsl(var(--app-primary-foreground))",
          accent: "hsl(var(--app-accent))",
          "accent-foreground": "hsl(var(--app-accent-foreground))",
          button: "hsl(var(--app-button))",
          "button-hover": "hsl(var(--app-button-hover))",
        },
      },
      borderColor: {
        strong: "hsl(var(--border-strong))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
