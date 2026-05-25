import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Geist Mono', 'ui-monospace', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        'bg-subtle': 'var(--bg-subtle)',
        'bg-hover': 'var(--bg-hover)',
        'bg-active': 'var(--bg-active)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: {
          DEFAULT: 'var(--text)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          fg: 'var(--accent-fg)',
        },
        income: {
          bg: 'var(--income-bg)',
          'bg-hover': 'var(--income-bg-hover)',
          fg: 'var(--income-fg)',
          'fg-soft': 'var(--income-fg-soft)',
        },
        expense: {
          bg: 'var(--expense-bg)',
          'bg-hover': 'var(--expense-bg-hover)',
          fg: 'var(--expense-fg)',
          'fg-soft': 'var(--expense-fg-soft)',
        },
        pending: {
          DEFAULT: 'var(--pending)',
          bg: 'var(--pending-bg)',
        },
        overdue: {
          DEFAULT: 'var(--overdue)',
          bg: 'var(--overdue-bg)',
        },
        paid: {
          DEFAULT: 'var(--paid)',
          bg: 'var(--paid-bg)',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}

export default config
