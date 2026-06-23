import { create } from "zustand";

export const THEME_ORDER = ["lantern", "lumina", "phoenix"] as const;
export type ThemeId = (typeof THEME_ORDER)[number];

const STORAGE_KEY = "storyscout.theme";
const DEFAULT_THEME: ThemeId = "lantern";

function readStoredTheme(): ThemeId {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && (THEME_ORDER as readonly string[]).includes(value)) {
      return value as ThemeId;
    }
  } catch {
    /* localStorage unavailable — fall back to default */
  }
  return DEFAULT_THEME;
}

function applyTheme(theme: ThemeId) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}

// Apply the persisted theme synchronously at module load so the very first
// paint already matches the user's choice (no flash of the default theme).
const initialTheme = readStoredTheme();
applyTheme(initialTheme);

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  setTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore persistence failures */
    }
    set({ theme });
  },
}));
