/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        allgigs: {
          blue: "#121f36",
          green: "#0ccf83",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
