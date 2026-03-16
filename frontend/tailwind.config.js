/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        dark: {
          900: "#0b1428",
          800: "#0f1c34",
          700: "#17253f",
          600: "#223251",
          500: "#33415f",
        },
        light: {
          900: "#f8fbff",
          800: "#eef4ff",
          700: "#e2ecff",
          600: "#cad9f5",
          500: "#a9bfdc",
        },
        accent: {
          purple: "#0a84ff",
          cyan: "#64d2ff",
          emerald: "#30d158",
          amber: "#ff9f0a",
          rose: "#ff453a",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
