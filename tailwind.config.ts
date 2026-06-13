import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
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
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        "border-default": "var(--border-default)",
        "border-strong": "var(--border-strong)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "accent-green": "var(--accent-green)",
        "accent-terracotta": "var(--accent-terracotta)",
        "accent-blue": "var(--accent-blue)",
        
        "tag-jee-bg": "var(--tag-jee-bg)",
        "tag-jee-text": "var(--tag-jee-text)",
        "tag-neet-bg": "var(--tag-neet-bg)",
        "tag-neet-text": "var(--tag-neet-text)",
        "tag-upsc-bg": "var(--tag-upsc-bg)",
        "tag-upsc-text": "var(--tag-upsc-text)",
        "tag-cbse-bg": "var(--tag-cbse-bg)",
        "tag-cbse-text": "var(--tag-cbse-text)",
        "tag-cat-bg": "var(--tag-cat-bg)",
        "tag-cat-text": "var(--tag-cat-text)",

        // Legacy colors pointing to new vars to prevent instant breaking before refactor
        ink: {
          DEFAULT: "var(--text-primary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent-terracotta)",
          foreground: "var(--text-primary)",
        },
        white: "var(--surface-raised)",
        "video-bg": "#3E3832",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        serif: ["var(--font-fraunces)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        hover: "var(--shadow-hover)",
        // Legacy
        solid: "var(--shadow-sm)",
        "solid-hover": "var(--shadow-hover)",
        modal: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
export default config;
