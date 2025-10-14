/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        impulse: {
          indigo: {
            light: "#6366F1",
            DEFAULT: "#4F46E5",
            dark: "#3730A3",
          },
          blue: {
            light: "#E0E7FF",
            DEFAULT: "#C7D2FE",
            dark: "#1E3A8A",
          },
          red: {
            light: "#FCA5A5",
            DEFAULT: "#EF4444",
            dark: "#B91C1C",
          },
          gray: {
            light: "#F9FAFB",
            DEFAULT: "#6B7280",
            dark: "#111827",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["Poppins", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}
