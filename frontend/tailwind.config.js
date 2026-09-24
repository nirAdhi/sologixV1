/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#006948',
          700: '#004d34',
          800: '#003828',
          900: '#002419',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#005a3c',
          600: '#006948',
          700: '#004d34',
          800: '#003828',
          900: '#002419',
        },
      },
      fontFamily: {
        sans:     ['Work Sans', 'Noto Sans Devanagari', 'sans-serif'],
        heading:  ['Manrope', 'Noto Sans Devanagari', 'sans-serif'],
        body:     ['Work Sans', 'Noto Sans Devanagari', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
