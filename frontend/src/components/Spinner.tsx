import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-brand-400", className)} />;
}

/**
 * A steaming mug of tea — the cozy stand-in for a loading spinner.
 * Three ribbons of steam drift up from a warm amber cup.
 */
export function TeaLoader({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-12 w-12 items-end justify-center", className)}>
      {/* steam */}
      <span className="absolute -top-1 left-1/2 flex -translate-x-1/2 gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-4 w-[3px] rounded-full bg-brand-300/70 animate-steam"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
      </span>
      {/* mug */}
      <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true" fill="none">
        <path
          d="M6 13h17v7a6 6 0 0 1-6 6h-5a6 6 0 0 1-6-6v-7Z"
          className="fill-ink-800 stroke-brand-500"
          strokeWidth="1.5"
        />
        <path
          d="M23 15h2.5a3.5 3.5 0 0 1 0 7H23"
          className="stroke-brand-500"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M9 21h11" className="stroke-brand-400/60" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-ink-400">
      <TeaLoader />
      {label ? (
        <p className="animate-pulse font-serif text-sm italic text-ink-300">{label}</p>
      ) : null}
    </div>
  );
}
