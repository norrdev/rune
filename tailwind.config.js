/** @type {import('tailwindcss').Config} */
export const darkMode = 'class';
export const content = ["./app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"];
export const theme = {
  extend: {},
};
export const presets = [require("nativewind/preset")];
export const plugins = [];
