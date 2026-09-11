/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: "#0B0B0C",
          900: "#121214",
          800: "#1B1B1E",
          700: "#26262A",
          600: "#38383E",
        },
        gold: {
          400: "#E8C97A",
          500: "#D8A94E",
          600: "#B9863A",
        },
        parchment: "#F4E7C9",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
