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
 * 3. Use the z-index scale below for layering (never hardcode z-index values)
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

      /**
       * Z-Index Scale
       * -------------
       * ALWAYS use these tokens instead of hardcoded z-index values.
       * This ensures consistent layering across the application.
       *
       * Layer hierarchy (lowest to highest):
       * - canvas (10): PDF pages and canvas elements
       * - toolbar (20): Floating toolbars
       * - canvas-active (50): Active canvas elements being dragged
       * - modal (50): Modal dialogs and overlays
       * - notification (60): Toast notifications (always on top)
       */
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
