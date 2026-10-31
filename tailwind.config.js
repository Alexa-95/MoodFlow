/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        flow: {
          bg: '#0A0F1E',
          surface: '#111A2B',
          raised: '#182337',
          border: '#25334A',
          text: '#F3F6FC',
          muted: '#93A2B9',
          accent: '#A8F27A',
          'accent-dark': '#1C3828',
          red: '#F27E91',
          amber: '#F5B968',
          yellow: '#E8DC73',
          green: '#9DDD77',
          teal: '#52C8B2',
        },
      },
    },
  },
  plugins: [],
};
