import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          DEFAULT: "rgb(var(--c-bg) / <alpha-value>)",
          surface: "rgb(var(--c-surface) / <alpha-value>)",
          card: "rgb(var(--c-card) / <alpha-value>)",
          muted: "rgb(var(--c-muted) / <alpha-value>)",
          border: "rgb(var(--c-border) / <alpha-value>)",
          text: "rgb(var(--c-text) / <alpha-value>)",
          subtle: "rgb(var(--c-subtle) / <alpha-value>)",
          primary: "#2E7BE0",
          primaryHover: "#4C90EB",
          accent: "#D1FF42",
          accentHover: "#A9CF2A",
          night: "#0B1118",
          secondary: "#1C2635",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
      },
      boxShadow: {
        glow: "0 4px 15px rgba(2, 81, 176, 0.25)",
        soft: "0 2px 10px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ['"Open Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0B1118 0%, #0251B0 100%)',
      }
    },
  },
  plugins: [],
};