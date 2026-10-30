/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8a3b2e', // Wax-seal oxblood
          dark: '#6b2a20',
          light: '#b45f4c',
        },
        accent: {
          DEFAULT: '#3f6f63', // Verdigris
          dark: '#2e544b',
          light: '#6e9a8c',
        },
        gold: {
          DEFAULT: '#b08a45',
          dark: '#8c6a2e',
          light: '#d4b26a',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['EB Garamond', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
