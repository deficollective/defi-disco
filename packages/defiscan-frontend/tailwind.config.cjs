/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#FAF9F7',
          card: '#FFFFFF',
          muted: '#F3F1EE',
          dark: '#1C1917',
        },
        // Institutional dark theme
        inst: {
          bg: '#0a0e17',
          surface: '#111827',
          card: '#1a2332',
          border: '#1f2d3d',
          'border-bright': '#2a3a4e',
          text: '#e2e8f0',
          'text-dim': '#8892a4',
          'text-muted': '#4a5568',
          accent: '#3b82f6',
          'accent-dim': '#1e40af',
          green: '#10b981',
          red: '#ef4444',
          amber: '#f59e0b',
          cyan: '#06b6d4',
        },
        brand: {
          50: '#F0F4FF',
          100: '#DFE8FF',
          200: '#C7D4FE',
          300: '#A1B4FD',
          400: '#7B8EFA',
          500: '#5C6BF5',
          600: '#4449E8',
          700: '#3735CD',
          800: '#2E2EA5',
          900: '#2B2C82',
        },
        purple: {
          50: '#F0F4FF',
          100: '#DFE8FF',
          200: '#C7D4FE',
          300: '#A1B4FD',
          400: '#7B8EFA',
          500: '#5C6BF5',
          600: '#4449E8',
          700: '#3735CD',
          800: '#2E2EA5',
          900: '#2B2C82',
        },
        text: {
          primary: '#1C1917',
          secondary: '#57534E',
          muted: '#A8A29E',
        },
        status: {
          red: '#DC2626',
          amber: '#D97706',
          green: '#059669',
          blue: '#2563EB',
        },
        risk: {
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#D97706',
          low: '#059669',
          minimal: '#0891B2',
        },
        capital: '#059669',
        token: '#D97706',
        border: '#E7E5E4',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(28, 25, 23, 0.04), 0 1px 2px -1px rgba(28, 25, 23, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(28, 25, 23, 0.08), 0 2px 4px -2px rgba(28, 25, 23, 0.04)',
        'elevated': '0 8px 24px -4px rgba(28, 25, 23, 0.1), 0 4px 8px -4px rgba(28, 25, 23, 0.06)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
