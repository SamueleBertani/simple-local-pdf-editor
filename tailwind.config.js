/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface colors for backgrounds
        surface: {
          DEFAULT: 'rgb(255 255 255)', // white
          dark: 'rgb(15 23 42)', // slate-900
          secondary: 'rgb(248 250 252)', // slate-50
          'secondary-dark': 'rgb(30 41 59)', // slate-800
        },
        // Border colors
        border: {
          DEFAULT: 'rgb(226 232 240)', // slate-200
          dark: 'rgb(51 65 85)', // slate-700
          light: 'rgb(241 245 249)', // slate-100
          'light-dark': 'rgb(30 41 59)', // slate-800
        },
      },
      // Z-index scale for consistent layering
      zIndex: {
        'canvas': '10',
        'canvas-active': '50',
        'toolbar': '20',
        'modal': '50',
        'notification': '60',
      },
    },
  },
  plugins: [],
}
