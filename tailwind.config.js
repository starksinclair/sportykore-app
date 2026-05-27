/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4A148C",
          50: "#F4ECFB",
          100: "#E5D3F4",
          200: "#C7A5E8",
          300: "#A877DC",
          400: "#7B3FBF",
          500: "#4A148C",
          600: "#3B1070",
          700: "#2C0C54",
          800: "#1E0838",
          900: "#0F041C",
        },
        accent: {
          DEFAULT: "#E6A817",
          50: "#FDF5E1",
          100: "#FBE9B8",
          200: "#F6D26B",
          300: "#F1BC2F",
          400: "#E6A817",
          500: "#E6A817",
          600: "#B88312",
          700: "#8A620E",
          800: "#5C4109",
          900: "#2E2105",
        },
      },
    },
  },
  plugins: [],
};
