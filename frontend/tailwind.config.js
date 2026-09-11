/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#0891B2',
        accent: '#EA580C',
        canvas: '#F8FAFC',
        ink: '#0F172A',
        muted: '#F1F5FD',
        line: '#E4ECFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px rgba(15, 23, 42, 0.06)',
        sheet: '0 10px 15px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
