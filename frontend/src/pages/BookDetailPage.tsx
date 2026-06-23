import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookPlus,
  Calendar,
  Check,
  FileText,
  Hash,
  Sparkles,
} from "lucide-react";

import { bookApi, libraryApi } from "@/api/endpoints";
import type { ReadingStatus } from "@/api/types";
import { BookCard } from "@/components/BookCard";
import { BookCover } from "@/components/BookCover";
import { RatingStars } from "@/components/RatingStars";
import { FullPageSpinner } from "@/components/Spinner";
import { statusLabel } from "@/lib/utils";

const STATUS_OPTIONS: ReadingStatus[] = ["want_to_read", "currently_reading", "read"];

export function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const id = Number(bookId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const bookQuery = useQuery({
    queryKey: ["books", id],
    queryFn: () => bookApi.get(id),
    enabled: Number.isFinite(id),
  });

  const libraryQuery = useQuery({ queryKey: ["library", "all"], queryFn: () => libraryApi.list() });
  const inLibrary = libraryQuery.data?.find((i) => i.book.id === id);

  const addMut = useMutation({
    mutationFn: (status: ReadingStatus) => libraryApi.add({ book_id: id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (bookQuery.isLoading) {
    return <FullPageSpinner label="Loading book…" />;
  }

  if (bookQuery.isError || !bookQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <p className="text-ink-300">We couldn't find that book.</p>
        <Link to="/app/explore" className="btn-secondary mt-4">
          Back to explore
        </Link>
      </div>
    );
  }

  const book = bookQuery.data;
  const themes = (book.themes ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const tropes = (book.tropes ?? "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-400 transition hover:text-ink-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        {/* Cover + actions */}
        <div>
          <div className="mx-auto w-48 md:w-full">
            <BookCover title={book.title} coverUrl={book.cover_url} className="shadow-2xl" />
          </div>

          <div className="mt-5 space-y-2">
            {inLibrary ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2.5 text-sm font-medium text-emerald-300">
                <Check className="h-4 w-4" />
                In your library · {statusLabel(inLibrary.status)}
              </div>
            ) : (
              <>
                <p className="text-center text-xs font-medium uppercase tracking-wide text-ink-500">
                  Add to library
                </p>
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => addMut.mutate(status)}
                    disabled={addMut.isPending}
                    className="btn-secondary w-full justify-start"
                  >
                    <BookPlus className="h-4 w-4" />
                    {statusLabel(status)}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{book.title}</h1>
          {book.subtitle ? <p className="mt-1 text-lg text-ink-300">{book.subtitle}</p> : null}
          {book.author ? (
            <p className="mt-2 text-ink-400">
              by <span className="font-medium text-ink-200">{book.author.name}</span>
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <RatingStars value={book.average_rating} size={18} />
            {book.ratings_count ? (
              <span className="text-sm text-ink-500">
                {book.ratings_count.toLocaleString()} ratings
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {book.genres.map((g) => (
              <span key={g.id} className="chip">
                {g.name}
              </span>
            ))}
          </div>

          {/* Meta row */}
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-400">
            {book.published_year ? (
              <Meta icon={Calendar} label="Published" value={String(book.published_year)} />
            ) : null}
            {book.page_count ? (
              <Meta icon={FileText} label="Pages" value={String(book.page_count)} />
            ) : null}
            {book.mood ? <Meta icon={Sparkles} label="Mood" value={book.mood} /> : null}
            {book.isbn ? <Meta icon={Hash} label="ISBN" value={book.isbn} /> : null}
          </div>

          {book.description ? (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
                About
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-ink-200">
                {book.description}
              </p>
            </div>
          ) : null}

          {themes.length > 0 ? (
            <TagSection title="Themes" tags={themes} />
          ) : null}
          {tropes.length > 0 ? <TagSection title="Tropes" tags={tropes} /> : null}
        </div>
      </div>

      {/* Similar books */}
      {book.similar_books.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-white">You might also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {book.similar_books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-ink-500" />
      <span className="text-ink-500">{label}:</span>
      <span className="font-medium text-ink-200">{value}</span>
    </div>
  );
}

function TagSection({ title, tags }: { title: string; tags: string[] }) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
