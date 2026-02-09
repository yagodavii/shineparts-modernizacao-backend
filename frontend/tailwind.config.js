/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shinerayRed: '#D92525', // Vermelho característico
        darkGrey: '#1a1a1a',
      }
    },
  },
  plugins: [],
}