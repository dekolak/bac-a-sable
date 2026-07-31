import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette sobre, orientée outil interne. À ajuster librement.
        bg: "#0b0d10",
        panel: "#14181d",
        border: "#232a31",
        muted: "#8a97a3",
        accent: "#4f9cf9",
      },
    },
  },
  plugins: [],
} satisfies Config;
