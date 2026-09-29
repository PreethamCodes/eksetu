/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0F2642',
          blue: '#1A4472',
          accent: '#0D74CE',
          light: '#F4F7FB',
          border: '#D2DEEB',
          success: '#107C41',
          successLight: '#E8F5E9',
          warning: '#D97706',
          danger: '#C5221F'
        }
      }
    },
  },
  plugins: [],
}
