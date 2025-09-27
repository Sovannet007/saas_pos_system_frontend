/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{jsx,js}"],
  theme: {
    extend: {
      fontFamily: {
        kh: ['"Noto Sans Khmer"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#111827", // primary (near-black)
          600: "#1f2937",
          500: "#374151",
        },
      },
    },
  },
  plugins: [],
};
