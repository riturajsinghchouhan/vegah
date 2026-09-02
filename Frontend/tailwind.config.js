/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          DEFAULT: "#FAFAFA",
          surface: "#FFFFFF",
          card: "#FFFFFF",
          muted: "#F3F4F6",
          border: "#E5E7EB",
          text: "#111827",
          subtle: "#6B7280",
          primary: "#FF5500",
          primaryHover: "#E64D00",
          secondary: "#F9FAFB",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
      },
      boxShadow: {
        glow: "0 4px 15px rgba(255, 85, 0, 0.2)",
        soft: "0 2px 10px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ['"Open Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
      }
    },
  },
  plugins: [],
};
