/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
    extend: {
      colors: {
        "theme-bg": "var(--theme-bg)",
        "theme-fg": "var(--theme-fg)",
        "theme-alternate": "var(--theme-alternate)",
      },
    },
  },
  plugins: [],
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  safelist: ["w-1/2", "w-0", "w-full"],
};
