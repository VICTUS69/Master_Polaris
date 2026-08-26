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
        polaris: {
          950: '#060a14',
          900: '#0a0f1d',
          850: '#0d1527',
          800: '#111c33',
          700: '#182749',
          600: '#233863',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          ice: '#38bdf8',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          violet: '#8b5cf6'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-fast': 'flow 1.5s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
