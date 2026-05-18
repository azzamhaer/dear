import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Warm minimalist palette
        cream: {
          50: "#FBF7F1",
          100: "#F6EFE4",
          200: "#EFE4D2",
        },
        ink: {
          900: "#1F1A17", // soft black
          700: "#3A322D",
          500: "#6B5F57",
          400: "#8C8079",
          300: "#B8AEA6",
        },
        rose: {
          dusty: "#D4A5A5",
          dustier: "#C49191",
          blush: "#E8C9C9",
          mist: "#F4E2E2",
        },
        sand: {
          100: "#F1E8DA",
          200: "#E5D6BE",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31, 26, 23, 0.04), 0 8px 24px rgba(31, 26, 23, 0.06)",
        glow: "0 10px 40px -10px rgba(212, 165, 165, 0.35)",
        card: "0 1px 0 rgba(31, 26, 23, 0.04), 0 6px 20px -8px rgba(31, 26, 23, 0.08)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease-out both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
