import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

export function Logo({ className, withWordmark = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-900/40">
        <BookGlyph className="h-5 w-5 text-white" />
      </span>
      {withWordmark ? (
        <span className="text-lg font-extrabold tracking-tight text-white">
          BookMind<span className="text-brand-400"> AI</span>
        </span>
      ) : null}
    </span>
  );
}

function BookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 5.5C5 4.67 5.67 4 6.5 4H12v16H6.5A1.5 1.5 0 0 1 5 18.5v-13Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M12 4h5.5c.83 0 1.5.67 1.5 1.5v13c0 .83-.67 1.5-1.5 1.5H12V4Z"
        fill="currentColor"
        opacity="0.6"
      />
      <circle cx="12" cy="12" r="1.6" fill="#312e81" />
    </svg>
  );
}
