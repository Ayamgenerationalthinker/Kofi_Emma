/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Abele Drums Coach palette — the exact named colors from the
        // product's visual-direction spec. Existing scale keys (charcoal/
        // gold/parchment) are kept as-is (28 files already reference them)
        // so this is a value swap, not a rename.
        charcoal: {
          950: "#0B0D0F", // Obsidian
          900: "#14171A", // Charcoal
          800: "#1B1F23", // Dark Slate
          700: "#26262A",
          600: "#38383E",
        },
        gold: {
          400: "#F2C45C", // Amber Highlight
          500: "#D9A441", // Abele Gold
          600: "#B88328",
        },
        parchment: "#F5F1E8", // Warm Ivory
        sand: "#A9A398", // Muted Sand
        success: "#6FAF7B", // Muted Green
        danger: "#C96B63", // Muted Red
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
