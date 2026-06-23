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
        title="Explore the library"
        subtitle="Browse the collection or search by title, author, or vibe."
        icon={Compass}
      />

      <form onSubmit={onSubmit} className="mb-6">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books…"
            className="input pl-10 pr-10"
          />
          {query ? (
            <button
              type="button"
              onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {isSearching ? (
        <p className="mb-4 flex items-center gap-2 text-sm text-ink-400">
          {searchQuery.isFetching ? <Spinner className="h-4 w-4" /> : null}
          {books.length} result{books.length === 1 ? "" : "s"} for{" "}
          <span className="font-medium text-ink-200">“{submitted}”</span>
        </p>
      ) : null}

      {activeQuery.isLoading ? (
        <FullPageSpinner label="Loading books…" />
      ) : books.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Search className="h-10 w-10 text-ink-600" />
          <div>
            <p className="font-medium text-ink-200">No books found</p>
            <p className="mt-1 text-sm text-ink-500">
              Try a different search, or browse the full collection.
            </p>
          </div>
          {isSearching ? (
            <button onClick={clear} className="btn-secondary mt-1">
              Browse all books
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
