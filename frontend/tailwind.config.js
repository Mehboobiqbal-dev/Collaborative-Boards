/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#10B981',
        accent: '#F59E0B',
        error: '#EF4444',
      },
      maxHeight: {
        '90vh': '90vh',
      },
    },
  },
  plugins: [],
}
