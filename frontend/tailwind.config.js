/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        navy: {
          DEFAULT: '#0B1F3A',
          800: '#132A4A',
          700: '#1B3A5F',
        },
        secondary: '#0891B2',
        accent: '#1D4ED8',
        canvas: '#F4F7FB',
        ink: '#0F172A',
        muted: '#EEF3FB',
        line: '#E2E8F4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 14px rgba(15, 23, 42, 0.06)',
        sheet: '0 12px 30px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
