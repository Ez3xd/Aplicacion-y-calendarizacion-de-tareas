import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#20231f",
        muted: "#85877f",
        paper: "#f7f8f5",
        leaf: "#526d50",
        lime: "#d8ef83",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 30px rgba(35, 43, 32, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
