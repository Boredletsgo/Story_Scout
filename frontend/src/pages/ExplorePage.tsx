import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Compass, Search, X } from "lucide-react";

import { bookApi } from "@/api/endpoints";
import { BookCard } from "@/components/BookCard";
import { PageHeader } from "@/components/AppLayout";
import { FullPageSpinner, Spinner } from "@/components/Spinner";

export function ExplorePage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const browseQuery = useQuery({
    queryKey: ["books", "browse"],
    queryFn: () => bookApi.list(0, 48),
    enabled: submitted.length === 0,
  });

  const searchQuery = useQuery({
    queryKey: ["books", "search", submitted],
    queryFn: () => bookApi.search(submitted, 48),
    enabled: submitted.length > 0,
    placeholderData: keepPreviousData,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query.trim());
  };

  const clear = () => {
    setQuery("");
    setSubmitted("");
  };

  const isSearching = submitted.length > 0;
  const activeQuery = isSearching ? searchQuery : browseQuery;
  const books = activeQuery.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <PageHeader
        title="The Grand Archives"
        subtitle="Wander the stacks, or whisper a title, author, or vibe to the shelves."
        icon={Compass}
      />

      <form onSubmit={onSubmit} className="mb-7">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400/70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the archives…"
            className="input pl-11 pr-10"
          />
          {query ? (
            <button
              type="button"
              onClick={clear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-500 transition hover:text-brand-300"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {isSearching ? (
        <p className="mb-5 flex items-center gap-2 font-serif text-sm italic text-ink-400">
          {searchQuery.isFetching ? <Spinner className="h-4 w-4" /> : null}
          {books.length} tome{books.length === 1 ? "" : "s"} found for{" "}
          <span className="font-medium not-italic text-brand-200">“{submitted}”</span>
        </p>
      ) : null}

      {activeQuery.isLoading ? (
        <FullPageSpinner label="Dusting off the shelves…" />
      ) : books.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Search className="h-10 w-10 text-ink-600" />
          <div>
            <p className="font-display text-lg font-semibold text-ink-100">No tomes found</p>
            <p className="mt-1 font-serif text-sm italic text-ink-500">
              Try a different spell, or wander the full collection.
            </p>
          </div>
          {isSearching ? (
            <button onClick={clear} className="btn-secondary mt-1">
              Browse all books
            </button>
          ) : null}
        </div>
      ) : (
        // A magical bookcase: wood frame, warm inner glow, shelf plank at base.
        <div className="rounded-3xl border border-brand-950/70 bg-wood-grain bg-ink-950/40 p-5 shadow-parchment">
          <div className="grid grid-cols-2 gap-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          <div className="mt-5 h-1 rounded-full border-b-4 border-brand-950/80 bg-gradient-to-r from-transparent via-brand-900/40 to-transparent" />
        </div>
      )}
    </div>
  );
}
