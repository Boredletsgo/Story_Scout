import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** When false (icon-only contexts), render the lockup a touch larger. */
  withWordmark?: boolean;
}

export function Logo({ className, withWordmark = true }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Story Scout — Personal Literary Finder"
      draggable={false}
      className={cn(
        "brand-logo w-auto select-none object-contain transition-all duration-500",
        withWordmark ? "h-12" : "h-16",
        className,
      )}
    />
  );
}

