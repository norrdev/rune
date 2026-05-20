/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#866c53',
          dark: '#6b5642',
          light: '#a8947f',
        },
      },
    },
  },
  plugins: [],
};
