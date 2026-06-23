import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

export function Logo({ className, withWordmark = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-700/50 bg-gradient-to-br from-ink-800 to-ink-950 shadow-glow">
        {/* Soft candle glow behind the emblem */}
        <span className="absolute inset-0 rounded-2xl bg-brand-400/10 blur-sm animate-glow" />
        <CompassBook className="relative h-6 w-6 text-brand-400" />
      </span>
      {withWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-cinzel text-base font-semibold tracking-wide text-ink-50">
            Story<span className="text-brand-400"> Scout</span>
          </span>
          <span className="mt-0.5 font-serif text-[0.6rem] italic tracking-wide text-ink-400">
            your cozy reading companion
          </span>
        </span>
      ) : null}
    </span>
  );
}

/** A compass rose cradling an open book — exploration meets stories. */
function CompassBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* compass ring */}
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.55"
      />
      {/* open book pages */}
      <path
        d="M12 7.4c-1.3-.85-2.9-1.2-4.6-1.2-.5 0-.9.4-.9.9v6.7c0 .5.4.9.9.9 1.7 0 3.3.35 4.6 1.2 1.3-.85 2.9-1.2 4.6-1.2.5 0 .9-.4.9-.9V7.1c0-.5-.4-.9-.9-.9-1.7 0-3.3.35-4.6 1.2Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M12 7.4v8.6" stroke="#1C120C" strokeWidth="0.9" />
      {/* north star needle */}
      <path
        d="M12 1.6l1.1 2.2L12 3.2l-1.1.6L12 1.6Z"
        fill="currentColor"
      />
    </svg>
  );
}
