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
        cream: "#FFF8EA"
      },
      fontFamily: {
        rounded: ["Nunito", "Quicksand", "ui-rounded", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        lift: "0 22px 60px rgba(23, 32, 51, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
