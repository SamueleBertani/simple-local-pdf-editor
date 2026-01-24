/**
 * Tailwind CSS Configuration
 * ==========================
 *
 * This project uses Tailwind CSS with custom extensions.
 *
 * IMPORTANT GUIDELINES:
 * ---------------------
 * 1. Use `cn()` from 'src/utils/cn.ts' for all className attributes
 * 2. Always include dark: variants for color-related classes
 * 3. Use Z_INDEX constants from 'src/constants/zIndex.ts' for layering
 * 4. Prefer existing component classes from index.css when available
 *
 * See STYLING.md for complete style guide.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  // Dark mode via class on <html> element
  darkMode: 'class',

  // Content paths for purging unused CSS
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      /**
       * Custom Colors
       * -------------
       * Semantic color tokens for consistent theming.
       * Use these instead of raw slate-* values when possible.
       */
      colors: {
        // Primary brand colors (orange from logo #F4971E)
        primary: {
          50: '#FEF7ED',       // Very light orange bg
          100: '#FEF3E2',      // Light orange bg (selected states)
          200: '#FDDCAB',      // Hover backgrounds
          300: '#FBBD74',      // Light accents
          400: '#F9A03F',      // Medium orange
          500: '#F4971E',      // Brand color (logo)
          600: '#DB7E0B',      // Darker for better contrast
          700: '#B5710A',      // Text on light (AA accessible)
          800: '#92510D',      // Dark text
          900: '#7C4006',      // Very dark (dark mode text)
          950: '#432106',      // Darkest
        },
        // Surface colors for backgrounds
        surface: {
          DEFAULT: 'rgb(255 255 255)',      // white - primary surface
          dark: 'rgb(15 23 42)',             // slate-900 - dark mode primary
          secondary: 'rgb(248 250 252)',     // slate-50 - secondary surface
          'secondary-dark': 'rgb(30 41 59)', // slate-800 - dark mode secondary
        },
        // Border colors
        border: {
          DEFAULT: 'rgb(226 232 240)',       // slate-200 - primary border
          dark: 'rgb(51 65 85)',             // slate-700 - dark mode border
          light: 'rgb(241 245 249)',         // slate-100 - subtle border
          'light-dark': 'rgb(30 41 59)',     // slate-800 - dark mode subtle
        },
      },
    },
  },

  plugins: [],
}
