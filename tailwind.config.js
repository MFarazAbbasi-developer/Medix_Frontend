/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Medix Brand Palette - Restrained Deep Red / Terracotta
        brand: {
          50: '#FCF5F5',
          100: '#F7E7E7',
          200: '#EFD1D1',
          300: '#E1B0B0',
          400: '#CE7E7E',
          500: '#9B2C2C', // Primary Accent
          600: '#842222',
          700: '#6C1B1B',
          800: '#561616',
          900: '#421212',
          950: '#2A0A0A',
        },
        // Warm Neutral & Surface Backgrounds
        surface: {
          base: '#F8F9FA', // Main background (warm off-white)
          card: '#FFFFFF', // Container / card surface
          muted: '#F1F3F5', // Subtle section backgrounds / table headers
          border: '#E5E7EB', // Neutral dividing lines
          borderStrong: '#D1D5DB', // Emphasized borders
        },
        // Charcoal Typography Hierarchy
        charcoal: {
          900: '#111827', // Primary heading / crucial numbers
          800: '#1F2937', // Default body text
          700: '#374151', // Secondary text
          600: '#4B5563', // Labels / helper text
          500: '#6B7280', // Muted timestamps / subtle indicators
          400: '#9CA3AF', // Disabled / placeholder
        },
        // Operational Semantic Colors
        status: {
          success: {
            bg: '#ECFDF5',
            border: '#A7F3D0',
            text: '#065F46',
            dot: '#10B981',
          },
          warning: {
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
            dot: '#F59E0B',
          },
          error: {
            bg: '#FEF2F2',
            border: '#FECACA',
            text: '#991B1B',
            dot: '#EF4444',
          },
          info: {
            bg: '#EFF6FF',
            border: '#BFDBFE',
            text: '#1E40AF',
            dot: '#3B82F6',
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
