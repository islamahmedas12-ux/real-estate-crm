/** @type {import('tailwindcss').Config} */
// NOTE: This project uses Tailwind CSS v4 which is configured primarily via
// CSS (@theme in index.css). This file exists for IDE tooling and v3 compat.
// Brand tokens are also declared as CSS custom properties in src/index.css.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // --- Primary brand blue ---
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // main brand color
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
          DEFAULT: '#2563EB',
        },
        // --- Secondary — emerald/teal ---
        secondary: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          DEFAULT: '#10B981',
        },
        // --- Neutrals ---
        neutral: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
          DEFAULT: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
