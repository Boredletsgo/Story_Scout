import { cn } from "@/lib/utils";
import { THEME_META } from "@/lib/themes";
import { THEME_ORDER, useThemeStore } from "@/store/theme";

/**
 * A compact segmented control that swaps the active theme. Used in the
 * sidebar and on the landing nav. When `labeled` is set, each option also
 * shows its world name (used in the wider sidebar footer).
 */
export function ThemeSwitcher({
  className,
  labeled = false,
}: {
  className?: string;
  labeled?: boolean;
}) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div
      role="radiogroup"
      aria-label="Choose a theme"
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl border border-brand-900/40 bg-ink-900/70 p-1 backdrop-blur",
        className,
      )}
    >
      {THEME_ORDER.map((id) => {
        const meta = THEME_META[id];
        const active = theme === id;
        const Icon = meta.icon;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${meta.name} — ${meta.persona}`}
            onClick={() => setTheme(id)}
            className={cn(
              "group flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-300 ease-in-out",
              active
                ? "bg-gradient-to-b from-brand-500 to-brand-700 text-ink-950 shadow-glow"
                : "text-ink-400 hover:bg-ink-800/70 hover:text-ink-100",
              labeled ? "flex-1 justify-center" : "",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110",
                active && "drop-shadow-[0_0_6px_rgb(var(--glow)/0.6)]",
              )}
            />
            {labeled ? (
              <span className="truncate font-serif text-xs tracking-wide">
                {meta.name.split(" ")[0]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
