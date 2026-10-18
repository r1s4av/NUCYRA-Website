/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bio: {
          950: '#030712',
          900: '#070D18',
          850: '#0C1526',
          800: '#142138',
          750: '#1B2C4B',
          700: '#23385E',
          600: '#344F7E',
          500: '#4D6EA4',
          400: '#7594C6',
          300: '#A6BEE1',
          200: '#D2E1F3',
          100: '#EDF4FC',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          900: '#2e1065',
          950: '#1e0845',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'monospace',
        ],
      },
      animation: {
        'scanline': 'scanBeam 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'pulse-subtle': 'pulseSlow 4s ease-in-out infinite',
      },
      keyframes: {
        scanBeam: {
          '0%': { top: '0%', opacity: '0' },
          '15%': { opacity: '0.85' },
          '85%': { opacity: '0.85' },
          '100%': { top: '100%', opacity: '0' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        }
      }
    },
  },
  plugins: [],
}
