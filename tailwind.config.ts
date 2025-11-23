import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505", // Deep black
        foreground: "#e0e0e0",
        neon: {
          blue: "#00f3ff", // Cyber Blue
          pink: "#bc13fe", // Cyber Pink
          green: "#0aff00", // Terminal Green
          yellow: "#f6ff00", // Hazard Yellow
        },
        panel: "#111111",
        panelBorder: "#333333",
      },
      fontFamily: {
        mono: ["Courier New", "monospace"], // Retro feel
        sans: ["Arial", "sans-serif"],
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glitch": "glitch 1s linear infinite",
      },
      keyframes: {
        glitch: {
          "2%, 64%": { transform: "translate(2px,0) skew(0deg)" },
          "4%, 60%": { transform: "translate(-2px,0) skew(0deg)" },
          "62%": { transform: "translate(0,0) skew(5deg)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
