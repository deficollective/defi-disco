/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#FAFAFE',
          card: '#FFFFFF',
          muted: '#F3F0F8',
          dark: '#1E1B2E',
        },
        purple: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        text: {
          primary: '#1E1B2E',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        status: {
          red: '#EF4444',
          amber: '#F59E0B',
          green: '#10B981',
          blue: '#3B82F6',
        },
        capital: '#10B981',
        token: '#F59E0B',
        border: '#E5E1ED',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
