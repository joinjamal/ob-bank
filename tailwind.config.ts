import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        basil: {
          DEFAULT: "#2F7DF6",
          soft: "#DCEBFF"
        },
        osama: {
          DEFAULT: "#8E5CF7",
          soft: "#ECE4FF"
        },
        mint: "#3DCC91",
        coral: "#FF765F",
        ink: "#172033",
        cream: "#FFF8EA",
        "arcade-dark": "#0f172a",
        "arcade-bg": "#1e293b",
        "arcade-green": "#39ff14",
        "arcade-pink": "#ff007f",
        "arcade-yellow": "#fffc00"
      },
      fontFamily: {
        rounded: ["Nunito", "Quicksand", "ui-rounded", "ui-sans-serif", "system-ui"],
        arcade: ["var(--font-arcade)", "monospace"]
      },
      boxShadow: {
        lift: "0 22px 60px rgba(23, 32, 51, 0.12)",
        retro: "4px 4px 0px 0px rgba(23, 32, 51, 1)"
      }
    }
  },
  plugins: []
};

export default config;
