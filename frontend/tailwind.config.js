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
         * All color tokens resolve to CSS variables (space-separated RGB
         * channels) so the active theme can be swapped at runtime via the
         * `data-theme` attribute on <html>. See src/index.css for the three
         * palettes: lantern (default), lumina, phoenix.
         *
         * `ink`   = background → surface → border → muted → primary text.
         * `brand` = the signature accent / "AI glow".
         * `mist`  = secondary magic accent. `ember` = warm flourish.
         */
        ink: {
          50: "rgb(var(--ink-50) / <alpha-value>)",
          100: "rgb(var(--ink-100) / <alpha-value>)",
          200: "rgb(var(--ink-200) / <alpha-value>)",
          300: "rgb(var(--ink-300) / <alpha-value>)",
          400: "rgb(var(--ink-400) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
          950: "rgb(var(--ink-950) / <alpha-value>)",
        },
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
          950: "rgb(var(--brand-950) / <alpha-value>)",
        },
        // Secondary "magic" accent for AI flourishes.
        mist: {
          300: "rgb(var(--mist-300) / <alpha-value>)",
          400: "rgb(var(--mist-400) / <alpha-value>)",
          500: "rgb(var(--mist-500) / <alpha-value>)",
        },
        // Warm secondary for flame / flicker touches.
        ember: {
          400: "rgb(var(--ember-400) / <alpha-value>)",
          500: "rgb(var(--ember-500) / <alpha-value>)",
        },
      },
      boxShadow: {
        glow: "0 0 15px rgb(var(--glow) / 0.10)",
        "glow-md": "0 0 28px rgb(var(--glow) / 0.16)",
        "glow-lg": "0 0 48px rgb(var(--glow) / 0.20)",
        "glow-mist": "0 0 28px rgb(var(--mist-400) / 0.18)",
        parchment:
          "0 1px 0 rgb(var(--ink-50) / 0.04) inset, 0 18px 40px -24px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        // Faint themed vignette for page canvases.
        hearth:
          "radial-gradient(120% 120% at 50% 0%, rgb(var(--glow) / 0.06) 0%, transparent 55%)",
        "wood-grain":
          "repeating-linear-gradient(90deg, rgb(var(--grain) / 0.10) 0px, rgb(var(--grain) / 0.10) 1px, transparent 1px, transparent 5px)",
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
