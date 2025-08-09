/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "theme-dark-bg": "#2C3531",
        "theme-teal": "#116466",
        "theme-mint": "#D1E8E2",
        "theme-tan": "#D9B08C",
        "theme-peach": "#FFCB9A",
        "cyber-bg": "#1D0225",
        "cyber-mint": "#6ECBF5",
        "cyber-lavender": "#E0D9F6",
        "cyber-teal": "#586AE2",
        "cyber-pink": "#C252E1",
      },
    },
  },
  plugins: [],
};
