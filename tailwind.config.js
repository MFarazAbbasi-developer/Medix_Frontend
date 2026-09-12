/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Medix Brand Palette - Locked Blue Theme
        brand: {
          50: '#F4F8FC', // Primary Lighter
          100: '#EAF3FA', // Primary Light
          200: '#CDE0F3',
          300: '#A6C7EA',
          400: '#619CD6',
          500: '#2563A6', // Primary
          600: '#1D4F85', // Primary Dark
          700: '#173F6A',
          800: '#112F50',
          900: '#0C2036',
          950: '#06101B',
        },
        primary: {
          DEFAULT: '#2563A6',
          dark: '#1D4F85',
          light: '#EAF3FA',
          lighter: '#F4F8FC',
        },
        // Surfaces & Backgrounds
        surface: {
          base: '#F5F7F9', // Main application background
          card: '#FFFFFF', // Container / card surface
          muted: '#F0F3F6', // Subtle section backgrounds / table headers
          border: '#DCE3E8', // Neutral dividing lines
          borderStrong: '#B9C7D0', // Emphasized borders
        },
        // Charcoal Typography Hierarchy
        charcoal: {
          900: '#202830', // Text Primary
          800: '#202830', // Text Primary
          700: '#5E6870', // Text Secondary
          600: '#5E6870', // Text Secondary / labels
          500: '#879198', // Text Muted / subtle indicators
          400: '#A8B2B9', // Disabled / placeholder
          300: '#C5CDD2',
        },
        // Operational Semantic Colors
        status: {
          success: {
            bg: '#E8F5EE',
            border: '#A3D9BE',
            text: '#198754',
            dot: '#198754',
          },
          warning: {
            bg: '#FDF7E8',
            border: '#F5DE99',
            text: '#996C00',
            dot: '#D99A00',
          },
          error: {
            bg: '#FAEAEA',
            border: '#F0B2B2',
            text: '#C93636',
            dot: '#C93636',
          },
          danger: {
            bg: '#FAEAEA',
            border: '#F0B2B2',
            text: '#C93636',
            dot: '#C93636',
          },
          info: {
            bg: '#EAF3FA',
            border: '#BDDBF1',
            text: '#2878B5',
            dot: '#2878B5',
          },
        },
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
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
