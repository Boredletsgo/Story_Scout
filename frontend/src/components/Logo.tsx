import { cn } from "@/lib/utils";
import { THEME_META } from "@/lib/themes";
import { useThemeStore } from "@/store/theme";

interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

export function Logo({ className, withWordmark = true }: LogoProps) {
  const theme = useThemeStore((s) => s.theme);
  const meta = THEME_META[theme];
  const Emblem = meta.icon;
  const [first, ...rest] = meta.name.split(" ");

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-700/50 bg-gradient-to-br from-ink-800 to-ink-950 shadow-glow transition-all duration-500">
        {/* Soft glow behind the emblem */}
        <span className="absolute inset-0 rounded-2xl bg-brand-400/10 blur-sm animate-glow" />
        <Emblem className="relative h-6 w-6 text-brand-400 transition-colors duration-500" />
      </span>
      {withWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-cinzel text-base font-semibold tracking-wide text-ink-50 transition-colors duration-500">
            {first}
            {rest.length ? <span className="text-brand-400"> {rest.join(" ")}</span> : null}
          </span>
          <span className="mt-0.5 font-serif text-[0.6rem] italic tracking-wide text-ink-400">
            {meta.tagline}
          </span>
        </span>
      ) : null}
    </span>
  );
}

