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
          bg: '#1A1420',
          primary: '#D4457C',
          accent: '#C9A84C',
          textPrimary: '#F6F0EB',
          textSecondary: '#CDBFC7',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
