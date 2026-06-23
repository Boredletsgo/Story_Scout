import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  BookPlus,
  Check,
  MessageSquareText,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Link } from "react-router-dom";

import { chatApi, feedbackApi, libraryApi } from "@/api/endpoints";
import type { ChatMessagePayload, RecommendationItem } from "@/api/types";
import { BookCover } from "@/components/BookCover";
import { PageHeader } from "@/components/AppLayout";
import { RatingStars } from "@/components/RatingStars";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: RecommendationItem[];
  streaming?: boolean;
}

const SUGGESTIONS = [
  "Something cozy with a slow-burn romance and a found family",
  "I loved Project Hail Mary — what's next?",
  "A dark fantasy with morally grey characters",
  "Page-turning thrillers with an unreliable narrator",
];

function uid() {
  return Math.random().toString(36).slice(2);
}

export function ChatPage() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = async (message: string) => {
    const text = message.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");

    const history: ChatMessagePayload[] = turns.map((t) => ({
      role: t.role,
      content: t.content,
    }));

    const assistantId = uid();
    setTurns((prev) => [
      ...prev,
      { id: uid(), role: "user", content: text },
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const done = await chatApi.stream(
        { message: text, session_id: sessionId, history, stream: true },
        (chunk) => {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === assistantId ? { ...t, content: t.content + chunk } : t,
            ),
          );
        },
        controller.signal,
      );

      setSessionId(done.session_id || sessionId);
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId
            ? { ...t, streaming: false, recommendations: done.recommendations }
            : t,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId
            ? {
                ...t,
                streaming: false,
                content:
                  t.content ||
                  "Sorry — I couldn't reach the recommendation engine. Please try again.",
              }
            : t,
        ),
      );
      if (!controller.signal.aborted) setError(msg);
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const empty = turns.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-800 px-5 py-4">
        <PageHeader
          title="Recommendations"
          subtitle="Describe what you're in the mood for — I'll find your next read."
          icon={MessageSquareText}
        />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6">
          {empty ? (
            <EmptyState onPick={(s) => void send(s)} />
          ) : (
            <div className="space-y-6">
              {turns.map((turn) =>
                turn.role === "user" ? (
                  <UserBubble key={turn.id} content={turn.content} />
                ) : (
                  <AssistantBubble key={turn.id} turn={turn} />
                ),
              )}
            </div>
          )}
          {error ? (
            <p className="mt-4 rounded-lg border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-ink-800 bg-ink-950/80 px-5 py-4 backdrop-blur">
        <form onSubmit={onSubmit} className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder="Tell me about a book, a mood, or an author you love…"
              className="input max-h-40 resize-none py-3 pr-12"
              style={{ minHeight: "3rem" }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="absolute bottom-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-500 disabled:opacity-40"
              aria-label="Send message"
            >
              {sending ? <Spinner className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-ink-600">
          BookMind reasons over your taste and library. Recommendations include reasons you can
          rate.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-900/40">
        <Sparkles className="h-7 w-7 text-white" />
      </span>
      <h2 className="text-xl font-semibold text-white">What should you read next?</h2>
      <p className="mt-2 max-w-md text-sm text-ink-400">
        Try one of these, or describe your own perfect book in the box below.
      </p>
      <div className="mt-6 grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="card px-4 py-3 text-left text-sm text-ink-200 transition hover:border-brand-600/60 hover:bg-ink-900"
          >
            “{s}”
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex animate-fade-in justify-end">
      <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-white">
        {content}
      </p>
    </div>
  );
}

function AssistantBubble({ turn }: { turn: ChatTurn }) {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-ink-800/70 px-4 py-3">
          {turn.content ? (
            <div className="markdown text-sm text-ink-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.content}</ReactMarkdown>
            </div>
          ) : turn.streaming ? (
            <TypingDots />
          ) : null}
          {turn.streaming && turn.content ? (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse-dot bg-brand-400 align-middle" />
          ) : null}
        </div>
      </div>

      {turn.recommendations && turn.recommendations.length > 0 ? (
        <div className="ml-11 grid gap-3 sm:grid-cols-2">
          {turn.recommendations.map((rec) => (
            <RecommendationCard key={rec.book.id} rec={rec} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-pulse-dot rounded-full bg-ink-400"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

function RecommendationCard({ rec }: { rec: RecommendationItem }) {
  const queryClient = useQueryClient();
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [added, setAdded] = useState(false);

  const feedbackMut = useMutation({
    mutationFn: (feedback: "up" | "down") =>
      feedbackApi.submit({ book_id: rec.book.id, feedback_type: feedback }),
  });

  const addMut = useMutation({
    mutationFn: () => libraryApi.add({ book_id: rec.book.id, status: "want_to_read" }),
    onSuccess: () => {
      setAdded(true);
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const castVote = (v: "up" | "down") => {
    setVote(v);
    feedbackMut.mutate(v);
  };

  return (
    <div className="card flex gap-3 p-3">
      <Link to={`/app/books/${rec.book.id}`} className="w-20 shrink-0">
        <BookCover title={rec.book.title} coverUrl={rec.book.cover_url} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          to={`/app/books/${rec.book.id}`}
          className="line-clamp-1 font-semibold text-ink-50 hover:text-brand-300"
          title={rec.book.title}
        >
          {rec.book.title}
        </Link>
        {rec.book.author ? (
          <p className="line-clamp-1 text-xs text-ink-400">{rec.book.author.name}</p>
        ) : null}
        <div className="mt-1">
          <RatingStars value={rec.book.average_rating} size={12} />
        </div>
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-300">{rec.reasoning}</p>

        <div className="mt-auto flex items-center gap-1.5 pt-2">
          <button
            onClick={() => addMut.mutate()}
            disabled={added || addMut.isPending}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition",
              added
                ? "bg-emerald-600/20 text-emerald-300"
                : "bg-brand-600/20 text-brand-200 hover:bg-brand-600/30",
            )}
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <BookPlus className="h-3.5 w-3.5" />}
            {added ? "Added" : "Add"}
          </button>
          <div className="ml-auto flex items-center gap-1">
            <VoteButton
              active={vote === "up"}
              onClick={() => castVote("up")}
              icon={ThumbsUp}
              activeClass="bg-emerald-600/20 text-emerald-300"
            />
            <VoteButton
              active={vote === "down"}
              onClick={() => castVote("down")}
              icon={ThumbsDown}
              activeClass="bg-rose-600/20 text-rose-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VoteButton({
  active,
  onClick,
  icon: Icon,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg transition",
        active ? activeClass : "text-ink-500 hover:bg-ink-800 hover:text-ink-300",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
