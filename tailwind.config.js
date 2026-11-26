/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b9ddff',
          500: '#1e73b8',
          600: '#155d99',
          700: '#10497a',
          800: '#0b365b',
        },
        copper: {
          400: '#d97e48',
          500: '#c86d3b',
          600: '#a65326',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
