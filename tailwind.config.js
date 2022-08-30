/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["pages", "components"].map((f) => `${f}/**/*.{js,jsx,ts,tsx}`),
  theme: {
    extend: {
      screens: {
        s360: "360px",
      },
    },
  },
  plugins: [],
};
