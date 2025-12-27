/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  presets: [require("nativewind/preset")],
  plugins: [],
}
