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
        parking: {
          bg: '#0a0f1d',
          surface: '#111827',
          card: '#161f38',
          cardBorder: '#233253',
          road: '#151d30',
          laneLine: '#334155',
          neonGreen: '#10b981',
          neonRed: '#ef4444',
          neonAmber: '#f59e0b',
          neonCyan: '#06b6d4',
        }
      },
      boxShadow: {
        'glow-green': '0 0 25px -5px rgba(16, 185, 129, 0.4), 0 0 10px -2px rgba(16, 185, 129, 0.2)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.4), 0 0 10px -2px rgba(239, 68, 68, 0.2)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-card': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
