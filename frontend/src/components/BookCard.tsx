import { Link } from "react-router-dom";

import type { Book } from "@/api/types";
import { BookCover } from "@/components/BookCover";
import { RatingStars } from "@/components/RatingStars";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  className?: string;
  footer?: React.ReactNode;
}

export function BookCard({ book, className, footer }: BookCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-ink-800 bg-ink-900/50 transition hover:border-brand-600/60 hover:bg-ink-900",
        className,
      )}
    >
      <Link to={`/app/books/${book.id}`} className="block">
        <BookCover title={book.title} coverUrl={book.cover_url} className="rounded-none" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          to={`/app/books/${book.id}`}
          className="line-clamp-2 font-semibold leading-snug text-ink-50 transition group-hover:text-brand-300"
          title={book.title}
        >
          {book.title}
        </Link>
        {book.author ? (
          <p className="line-clamp-1 text-xs text-ink-400">{book.author.name}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-1">
          <RatingStars value={book.average_rating} size={13} />
          {book.genres[0] ? (
            <span className="truncate rounded-full bg-ink-800 px-2 py-0.5 text-[10px] font-medium text-ink-300">
              {book.genres[0].name}
            </span>
          ) : null}
        </div>
        {footer}
      </div>
    </div>
  );
}
