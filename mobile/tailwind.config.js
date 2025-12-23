/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#4ADE80',
        background: '#0A1A15',
        surface: '#1B332D',
        accent: '#6B4EFF',
        textPrimary: '#FFFFFF',
        textSecondary: '#6B7280',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
