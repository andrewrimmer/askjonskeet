/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        skeet: {
          orange: '#F48024',
          dark: '#1C1C1C',
          gray: '#2D2D2D',
          light: '#F5F5F5',
        }
      }
    },
  },
  plugins: [],
}
