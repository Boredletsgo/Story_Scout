import { clsx, type ClassValue } from "clsx";

/** Tailwind-friendly className combiner. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

const STATUS_LABELS: Record<string, string> = {
  want_to_read: "Want to read",
  currently_reading: "Reading",
  read: "Read",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic gradient for a book without a cover image. */
export function coverGradient(seed: string): string {
  // Warm, candle-lit spines for the archive.
  const palettes = [
    "from-amber-700 to-yellow-900",
    "from-rose-800 to-amber-900",
    "from-emerald-800 to-teal-900",
    "from-orange-700 to-red-900",
    "from-violet-800 to-indigo-900",
    "from-yellow-700 to-amber-900",
    "from-stone-700 to-amber-950",
    "from-fuchsia-900 to-purple-950",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return palettes[Math.abs(hash) % palettes.length];
}

/**
 * A faint, genre-tinted glow (border + ambient shadow) for book cards, so the
 * shelves shimmer slightly by genre — gold for fantasy, green for slice-of-life,
 * misty purple for mystery, ember for thrillers, and so on.
 */
export function genreGlow(genre?: string | null): string {
  const g = (genre ?? "").toLowerCase();
  if (/fantasy|epic|myth|magic/.test(g))
    return "border-amber-700/40 hover:border-brand-400/70 hover:shadow-[0_0_22px_rgba(229,169,60,0.20)]";
  if (/mystery|crime|detective/.test(g))
    return "border-violet-800/40 hover:border-mist-400/70 hover:shadow-[0_0_22px_rgba(163,147,235,0.20)]";
  if (/slice|contempor|literary|romance/.test(g))
    return "border-emerald-800/40 hover:border-emerald-400/60 hover:shadow-[0_0_22px_rgba(52,211,153,0.16)]";
  if (/thriller|horror|dark|suspense/.test(g))
    return "border-orange-900/50 hover:border-ember-400/70 hover:shadow-[0_0_22px_rgba(232,133,59,0.18)]";
  if (/sci|science|space|dystop/.test(g))
    return "border-teal-800/40 hover:border-teal-400/60 hover:shadow-[0_0_22px_rgba(45,212,191,0.16)]";
  // Default: warm candle gold.
  return "border-amber-900/40 hover:border-brand-500/60 hover:shadow-glow-md";
}

export function formatRating(rating: number | null | undefined): string {
  if (!rating) return "—";
  return rating.toFixed(1);
}
