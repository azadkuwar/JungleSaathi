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
        forest: {
          darkest: '#0B1511', // Background
          card: '#14231C',    // Card background
          cardHover: '#1B2F26',
          border: '#234436',  // Card / element border
          primary: '#123B2A', // Primary
          secondary: '#1D5B40', // Secondary
          accent: '#34D399',  // Accent emerald
          accentHover: '#10B981',
          muted: '#8EAA9B',   // Muted text
          text: '#F1F5F2',    // Base text
          warning: '#F59E0B',
          critical: '#EF4444',
          info: '#38BDF8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar-sweep': 'radarSweep 3s linear infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}

