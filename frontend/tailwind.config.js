/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Utility / body text — soft, highly readable.
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // Elegant display serif for headers (the "lore").
        display: ["'Cormorant Garamond'", "ui-serif", "Georgia", "serif"],
        serif: ["Merriweather", "ui-serif", "Georgia", "serif"],
        // Carved-into-stone fantasy script for the wordmark & eyebrows.
        cinzel: ["Cinzel", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        /**
         * `ink` = warm, enveloping darks → parchment lights.
         * Remapped from cold slate so every existing `ink-*` class becomes
         * espresso / walnut / vintage-leather / cream automatically.
         */
        ink: {
          50: "#FBF7F1", // lightest parchment
          100: "#F4EBE1", // parchment — primary text
          200: "#E6D6C3",
          300: "#D2B48C", // warm sepia — secondary text
          400: "#B89A78", // muted sepia
          500: "#8A7058", // faint sepia
          600: "#5E4A38", // disabled / hairlines
          700: "#3E2D1F", // soft borders
          800: "#2D1F16", // vintage leather surface / borders
          900: "#241710", // warm walnut surface
          950: "#1C120C", // deep espresso background
        },
        /**
         * `brand` = the "AI glow": ethereal amber / candle gold.
         * Remapped from indigo so accents, buttons and focus rings glow warm.
         */
        brand: {
          50: "#FBF3E2",
          100: "#F8E7C4",
          200: "#F4D89B",
          300: "#EFC474", // light amber — hover text accents
          400: "#E5A93C", // ✦ the signature AI glow
          500: "#D9982E",
          600: "#C5841F", // primary button
          700: "#9E6818", // active
          800: "#714912",
          900: "#4E330E", // deep amber for filigree borders / shadows
          950: "#2E1E08",
        },
        // Misty lavender — secondary "magic" accent for AI flourishes.
        mist: {
          300: "#C7BBF2",
          400: "#A393EB",
          500: "#8A78DE",
        },
        // Hearth ember — warm secondary for flame/flicker touches.
        ember: {
          400: "#E8853B",
          500: "#D86B22",
        },
      },
      boxShadow: {
        glow: "0 0 15px rgba(229,169,60,0.10)",
        "glow-md": "0 0 28px rgba(229,169,60,0.16)",
        "glow-lg": "0 0 48px rgba(229,169,60,0.20)",
        "glow-mist": "0 0 28px rgba(163,147,235,0.18)",
        parchment:
          "0 1px 0 rgba(244,235,225,0.04) inset, 0 18px 40px -24px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        // Faint warm vignette for page canvases.
        hearth:
          "radial-gradient(120% 120% at 50% 0%, rgba(229,169,60,0.06) 0%, rgba(28,18,12,0) 55%)",
        "wood-grain":
          "repeating-linear-gradient(90deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 5px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-slow": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.99)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        // Steam rising from a cup of tea (loading state).
        steam: {
          "0%": { opacity: "0", transform: "translateY(2px) scaleX(1)" },
          "35%": { opacity: "0.7" },
          "100%": { opacity: "0", transform: "translateY(-14px) scaleX(1.6)" },
        },
        // Gentle candle / ember flicker.
        flicker: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "45%": { opacity: "0.82", transform: "scale(0.98)" },
          "70%": { opacity: "0.94", transform: "scale(1.01)" },
        },
        // Slow floating drift for sparkles / runes.
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        // Breathing amber glow.
        glow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        // Pages gently turning (loading state).
        "page-turn": {
          "0%": { transform: "rotateY(0deg)", opacity: "1" },
          "50%": { transform: "rotateY(-160deg)", opacity: "0.6" },
          "100%": { transform: "rotateY(0deg)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-slow": "fade-in-slow 0.6s ease-out both",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
        steam: "steam 2.6s ease-out infinite",
        flicker: "flicker 3.2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        glow: "glow 2.8s ease-in-out infinite",
        "page-turn": "page-turn 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
