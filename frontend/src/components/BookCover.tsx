import { useState } from "react";
import { BookOpen } from "lucide-react";

import { cn, coverGradient } from "@/lib/utils";

interface BookCoverProps {
  title: string;
  coverUrl?: string | null;
  className?: string;
}

export function BookCover({ title, coverUrl, className }: BookCoverProps) {
  const [errored, setErrored] = useState(false);
  const showImage = coverUrl && !errored;

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-lg",
        className,
      )}
    >
      {showImage ? (
        <img
          src={coverUrl}
          alt={`Cover of ${title}`}
          loading="lazy"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center bg-gradient-to-br p-3 text-center",
            coverGradient(title),
          )}
        >
          <BookOpen className="mb-2 h-6 w-6 text-white/80" />
          <span className="line-clamp-4 font-serif text-sm font-medium leading-snug text-white">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
