
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.svelte",
    "./lib/**/*.{svelte,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
