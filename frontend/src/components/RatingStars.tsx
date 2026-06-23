import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number | null | undefined;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function RatingStars({ value, size = 14, showValue = true, className }: RatingStarsProps) {
  const rating = value ?? 0;
  return (
    <span className={cn("inline-flex items-center gap-1 text-amber-400", className)}>
      <span className="inline-flex">
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = rating - i >= 0.75;
          const half = !filled && rating - i >= 0.25;
          return (
            <Star
              key={i}
              width={size}
              height={size}
              className={cn(filled || half ? "fill-amber-400" : "fill-transparent text-ink-600")}
              strokeWidth={1.75}
            />
          );
        })}
      </span>
      {showValue ? (
        <span className="text-xs font-medium text-ink-300">
          {rating ? rating.toFixed(1) : "—"}
        </span>
      ) : null}
    </span>
  );
}
