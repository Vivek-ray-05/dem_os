/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",      // Removed /src
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Removed /src
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",    // Just in case
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f0f11",
        surface: "#18181c",
        primary: "#4a9eff",
        success: "#4caf7d",
      },
    },
  },
  plugins: [],
};