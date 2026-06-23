import { Link } from "react-router-dom";

import type { Book } from "@/api/types";
import { BookCover } from "@/components/BookCover";
import { RatingStars } from "@/components/RatingStars";
import { cn, genreGlow } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  className?: string;
  footer?: React.ReactNode;
}

export function BookCard({ book, className, footer }: BookCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-ink-900/50 transition-all duration-500 ease-in-out hover:-translate-y-1 hover:bg-ink-900",
        genreGlow(book.genres[0]?.name),
        className,
      )}
    >
      <Link to={`/app/books/${book.id}`} className="block">
        <BookCover title={book.title} coverUrl={book.cover_url} className="rounded-none" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <Link
          to={`/app/books/${book.id}`}
          className="line-clamp-2 font-display text-[1.05rem] font-semibold leading-snug text-ink-50 transition group-hover:text-brand-300"
          title={book.title}
        >
          {book.title}
        </Link>
        {book.author ? (
          <p className="line-clamp-1 font-serif text-xs italic text-ink-400">{book.author.name}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <RatingStars value={book.average_rating} size={13} />
          {book.genres[0] ? (
            <span className="chip truncate text-[10px]">{book.genres[0].name}</span>
          ) : null}
        </div>
        {footer}
      </div>
    </div>
  );
}
