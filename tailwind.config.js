export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bite: {
          primary: "#FF4F18",
          bg: "#0C0F14",
          panel: "#161B22",
          line: "rgba(255,255,255,0.1)",
        },
      },
      boxShadow: {
        glow: "0 18px 70px rgba(255, 79, 24, 0.18)",
      },
    },
  },
  plugins: [],
};
