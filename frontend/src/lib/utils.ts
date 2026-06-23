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
  const palettes = [
    "from-indigo-500 to-purple-600",
    "from-rose-500 to-orange-500",
    "from-emerald-500 to-teal-600",
    "from-sky-500 to-blue-600",
    "from-fuchsia-500 to-pink-600",
    "from-amber-500 to-red-500",
    "from-violet-500 to-indigo-600",
    "from-cyan-500 to-emerald-600",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return palettes[Math.abs(hash) % palettes.length];
}

export function formatRating(rating: number | null | undefined): string {
  if (!rating) return "—";
  return rating.toFixed(1);
}
