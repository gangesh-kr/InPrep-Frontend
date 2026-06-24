/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563EB',
          'blue-light': '#EFF6FF',
          'blue-dark': '#1D4ED8',
          black: '#0F172A',
          white: '#FFFFFF',
          gray: '#F8FAFC',
          border: '#E2E8F0',
          textSecondary: '#475569',
        }
      }
    },
  },
  plugins: [],
}
