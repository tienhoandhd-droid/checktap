/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: '#EEF5F2',
        surface: '#FFFFFF',
        ink: '#15302A',
        body: '#33433E',
        muted: '#5E7268',
        line: '#DCE9E4',
        pine: '#1F5C4D',
        teal: '#2E8B74',
        mint: '#6FBFA6',
        'mint-50': '#E8F3EF',
        'mint-100': '#D7EAE2',
        good: '#2E8B74',
        warn: '#B9842B',
        alert: '#C0563F',
        neutral: '#64748B',
      },
      fontFamily: {
        display: ['"Spline Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,92,77,0.05), 0 8px 24px -16px rgba(31,92,77,0.18)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
}
