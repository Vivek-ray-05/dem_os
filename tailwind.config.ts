/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f0f11",
        surface:    "#18181c",
        primary:    "#00b4d8",  // single source of truth — was #4a9eff
        success:    "#4caf7d",
        danger:     "#ef4444",
        warn:       "#f59e0b",
      },
    },
  },
  plugins: [],
};