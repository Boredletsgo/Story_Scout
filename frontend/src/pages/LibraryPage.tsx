import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, LibraryBig, MessageSquareText, Star, Trash2 } from "lucide-react";

import { libraryApi } from "@/api/endpoints";
import type { LibraryItem, ReadingStatus } from "@/api/types";
import { BookCover } from "@/components/BookCover";
import { PageHeader } from "@/components/AppLayout";
import { FullPageSpinner } from "@/components/Spinner";
import { cn, statusLabel } from "@/lib/utils";

const TABS: { key: ReadingStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "currently_reading", label: "Reading" },
  { key: "want_to_read", label: "Want to read" },
  { key: "read", label: "Read" },
];

export function LibraryPage() {
  const [tab, setTab] = useState<ReadingStatus | "all">("all");
  const queryClient = useQueryClient();

  const libraryQuery = useQuery({
    queryKey: ["library", "all"],
    queryFn: () => libraryApi.list(),
  });

  const removeMut = useMutation({
    mutationFn: (bookId: number) => libraryApi.remove(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ bookId, status }: { bookId: number; status: ReadingStatus }) =>
      libraryApi.update(bookId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (libraryQuery.isLoading) {
    return <FullPageSpinner label="Loading your library…" />;
  }

  const all = libraryQuery.data ?? [];
  const items = tab === "all" ? all : all.filter((i) => i.status === tab);

  const counts: Record<string, number> = {
    all: all.length,
    currently_reading: all.filter((i) => i.status === "currently_reading").length,
    want_to_read: all.filter((i) => i.status === "want_to_read").length,
    read: all.filter((i) => i.status === "read").length,
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <PageHeader
        title="My Library"
        subtitle="Your personal collection — read, reading, and waiting by the fire."
        icon={LibraryBig}
      />

      {/* Tabs — carved shelf labels */}
      <div className="mb-6 flex flex-wrap gap-2 shelf">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative -mb-px flex items-center gap-2 rounded-t-2xl border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out",
              tab === t.key
                ? "border-brand-500 bg-brand-600/10 text-brand-200 drop-shadow-[0_0_6px_rgba(229,169,60,0.35)]"
                : "border-transparent text-ink-400 hover:text-ink-100",
            )}
          >
            <span className="font-serif tracking-wide">{t.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs",
                tab === t.key ? "bg-brand-600/25 text-brand-200" : "bg-ink-800 text-ink-400",
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <BookOpen className="h-10 w-10 text-ink-600" />
          <div>
            <p className="font-display text-lg font-semibold text-ink-100">
              {tab === "all" ? "Your shelves are bare" : `Nothing in “${statusLabel(tab)}” yet`}
            </p>
            <p className="mt-1 font-serif text-sm italic text-ink-500">
              Sit by the Hearth and let the Scout find stories to fill them.
            </p>
          </div>
          <Link to="/app/chat" className="btn-primary mt-1">
            <MessageSquareText className="h-4 w-4" />
            Find books
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <LibraryRow
              key={item.id}
              item={item}
              onRemove={() => removeMut.mutate(item.book.id)}
              onStatusChange={(status) =>
                updateMut.mutate({ bookId: item.book.id, status })
              }
              removing={removeMut.isPending && removeMut.variables === item.book.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryRow({
  item,
  onRemove,
  onStatusChange,
  removing,
}: {
  item: LibraryItem;
  onRemove: () => void;
  onStatusChange: (status: ReadingStatus) => void;
  removing: boolean;
}) {
  return (
    <div className="card flex items-center gap-4 p-3.5 transition-all duration-500 hover:shadow-glow-md">
      <Link to={`/app/books/${item.book.id}`} className="w-14 shrink-0">
        <BookCover title={item.book.title} coverUrl={item.book.cover_url} />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={`/app/books/${item.book.id}`}
          className="line-clamp-1 font-display text-lg font-semibold text-ink-50 hover:text-brand-300"
        >
          {item.book.title}
        </Link>
        {item.book.author ? (
          <p className="line-clamp-1 font-serif text-sm italic text-ink-400">
            {item.book.author.name}
          </p>
        ) : null}
        {item.status === "currently_reading" && item.progress_percent > 0 ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${item.progress_percent}%` }}
              />
            </div>
            <span className="text-xs text-ink-500">{item.progress_percent}%</span>
          </div>
        ) : null}
        {item.status === "read" && item.user_rating ? (
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            {item.user_rating}/5
          </div>
        ) : null}
      </div>

      <select
        value={item.status}
        onChange={(e) => onStatusChange(e.target.value as ReadingStatus)}
        className="input w-auto py-1.5 text-sm"
      >
        <option value="want_to_read">Want to read</option>
        <option value="currently_reading">Reading</option>
        <option value="read">Read</option>
      </select>

      <button
        onClick={onRemove}
        disabled={removing}
        className="rounded-lg p-2 text-ink-500 transition hover:bg-rose-950/40 hover:text-rose-400 disabled:opacity-50"
        aria-label="Remove from library"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
