import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: "var(--color-canvas)",
        white: "var(--color-white)",
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-muted)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-ink)",
        },
        surface: "var(--color-surface)",
        "video-bg": "var(--color-video-bg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-fraunces)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        solid: "2px 2px 0px var(--color-ink)",
        "solid-hover": "4px 4px 0px var(--color-ink)",
        modal: "8px 8px 0px var(--color-ink)",
      },
    },
  },
  plugins: [],
};
export default config;
