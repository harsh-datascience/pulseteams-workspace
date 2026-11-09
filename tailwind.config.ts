import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rail: 'var(--bg-app-rail)',
        secondary: 'var(--bg-secondary-pane)',
        stage: 'var(--bg-main-stage)',
        card: 'var(--bg-card-surface)',
        hover: 'var(--bg-surface-hover)',
        selected: 'var(--bg-surface-selected)',
        brand: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-primary-hover)',
        },
        borderSubtle: 'var(--border-subtle)',
      },
    },
  },
  plugins: [],
};
export default config;
