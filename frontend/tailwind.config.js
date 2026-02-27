/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f8f7",
          500: "#2f7d72",
          700: "#22574f",
        },
      },
    },
  },
  plugins: [],
};
