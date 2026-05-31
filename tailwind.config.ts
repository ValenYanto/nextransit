import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: "#6CCFF6",
          black: "#001011",
          grey: "#757780",
          porcelain: "#FFFFFC",
          green: "#10B981",
          amber: "#F59E0B",
          red: "#EF4444",
          card: "#0d1f22",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
