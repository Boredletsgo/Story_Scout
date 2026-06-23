import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookPlus,
  Check,
  Feather,
  Quote,
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
import { Spinner, TeaLoader } from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { THEME_META } from "@/lib/themes";
import { useThemeStore } from "@/store/theme";

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
  const copy = THEME_META[useThemeStore((s) => s.theme)].chat;

  return (
    <div className="flex h-full flex-col bg-hearth">
      <div className="border-b border-brand-950/60 px-5 py-4 shelf">
        <PageHeader
          title={copy.heading}
          subtitle={copy.subtitle}
          icon={Feather}
        />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-8">
          {empty ? (
            <EmptyState onPick={(s) => void send(s)} />
          ) : (
            <div className="space-y-7">
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
            <p className="mt-4 rounded-2xl border border-rose-900/50 bg-rose-950/40 px-4 py-2.5 font-serif text-sm italic text-rose-300">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      {/* Composer — an open, glowing spellbook */}
      <div className="border-t border-brand-950/60 bg-ink-950/80 px-5 py-5 backdrop-blur">
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
          <div className="group relative rounded-3xl border border-brand-900/40 bg-gradient-to-br from-ink-900/90 to-ink-950/80 p-1.5 shadow-glow transition-all duration-500 focus-within:border-brand-500/60 focus-within:shadow-glow-md">
            {/* spine seam down the middle of the open book */}
            <span className="pointer-events-none absolute inset-y-3 left-1/2 w-px bg-gradient-to-b from-transparent via-brand-800/30 to-transparent" />
            <div className="relative flex items-end gap-2">
              <Sparkles className="mb-3 ml-3 h-5 w-5 shrink-0 text-brand-400/70 animate-glow" />
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
                placeholder={copy.placeholder}
                className="max-h-40 flex-1 resize-none bg-transparent py-3 font-serif text-sm text-ink-100 placeholder:italic placeholder:text-ink-500 focus:outline-none"
                style={{ minHeight: "3rem" }}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="mb-2 mr-2 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-500 to-brand-700 text-ink-950 shadow-glow transition-all duration-300 hover:from-brand-400 hover:to-brand-600 hover:shadow-glow-md disabled:opacity-40"
                aria-label="Send message"
              >
                {sending ? <Spinner className="h-4 w-4 text-ink-950" /> : <Feather className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>
        <p className="mx-auto mt-2.5 max-w-3xl text-center font-serif text-xs italic text-ink-600">
          The Scout reads your taste and your shelves to find a kindred story — every pick comes
          with a note you can bless or banish.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  const meta = THEME_META[useThemeStore((s) => s.theme)];
  const Emblem = meta.icon;
  return (
    <div className="flex flex-col items-center py-12 text-center animate-fade-in-slow">
      <span className="relative mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-brand-700/40 bg-gradient-to-br from-ink-800 to-ink-950 shadow-glow-md">
        <span className="absolute inset-0 rounded-3xl bg-brand-400/10 blur animate-glow" />
        <Emblem className="relative h-8 w-8 text-brand-400 animate-float" />
      </span>
      <p className="eyebrow mb-2">{meta.persona}</p>
      <h2 className="font-display text-2xl font-semibold text-ink-50">
        {meta.chat.emptyTitle}
      </h2>
      <p className="mt-2 max-w-md font-serif text-sm italic text-ink-400">
        Whisper a mood, a memory, or a beloved book — or follow one of these worn signposts.
      </p>
      <div className="mt-7 grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group relative rounded-2xl border border-brand-900/40 bg-ink-900/60 px-4 py-3.5 text-left font-serif text-sm italic text-ink-200 shadow-parchment transition-all duration-500 ease-in-out hover:-translate-y-0.5 hover:border-brand-500/60 hover:text-brand-100 hover:shadow-glow-md"
          >
            <span className="mr-2 text-brand-400/70 transition group-hover:text-brand-400">✦</span>
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
      <p className="max-w-[80%] whitespace-pre-wrap rounded-3xl rounded-br-lg border border-brand-700/40 bg-gradient-to-br from-brand-600 to-brand-700 px-4 py-2.5 font-serif text-ink-950 shadow-glow">
        {content}
      </p>
    </div>
  );
}

function AssistantBubble({ turn }: { turn: ChatTurn }) {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-brand-700/40 bg-gradient-to-br from-ink-800 to-ink-950 shadow-glow">
          <Sparkles className="h-4 w-4 text-brand-400" />
        </span>
        <div className="min-w-0 flex-1 rounded-3xl rounded-tl-lg border border-brand-900/30 bg-ink-900/60 px-4 py-3 shadow-parchment">
          {turn.content ? (
            <div className="markdown font-serif text-sm text-ink-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.content}</ReactMarkdown>
            </div>
          ) : turn.streaming ? (
            <ScoutSearching />
          ) : null}
          {turn.streaming && turn.content ? (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse-dot bg-brand-400 align-middle" />
          ) : null}
        </div>
      </div>

      {turn.recommendations && turn.recommendations.length > 0 ? (
        <div className="ml-12">
          <p className="eyebrow mb-2.5">{THEME_META[useThemeStore((s) => s.theme)].chat.results}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {turn.recommendations.map((rec) => (
              <RecommendationCard key={rec.book.id} rec={rec} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Cozy loading state: a steaming cup while the agent searches the stacks. */
function ScoutSearching() {
  const copy = THEME_META[useThemeStore((s) => s.theme)].chat;
  return (
    <div className="flex items-center gap-3 py-1">
      <TeaLoader className="h-10 w-10" />
      <span className="font-serif text-sm italic text-ink-400">{copy.loading}</span>
    </div>
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
    <div className="card flex flex-col gap-3 p-3.5 transition-all duration-500 hover:shadow-glow-md">
      <div className="flex gap-3">
        <Link to={`/app/books/${rec.book.id}`} className="w-20 shrink-0">
          <BookCover title={rec.book.title} coverUrl={rec.book.cover_url} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <Link
            to={`/app/books/${rec.book.id}`}
            className="line-clamp-1 font-display text-lg font-semibold text-ink-50 hover:text-brand-300"
            title={rec.book.title}
          >
            {rec.book.title}
          </Link>
          {rec.book.author ? (
            <p className="line-clamp-1 font-serif text-xs italic text-ink-400">
              {rec.book.author.name}
            </p>
          ) : null}
          <div className="mt-1">
            <RatingStars value={rec.book.average_rating} size={12} />
          </div>
        </div>
      </div>

      {/* The Archivist's / Oracle's Note — hand-written reasoning on a scroll. */}
      <blockquote className="archivist-note text-xs">
        <span className="eyebrow mb-1 flex items-center gap-1.5">
          <Quote className="h-3 w-3" /> {THEME_META[useThemeStore((s) => s.theme)].chat.noteLabel}
        </span>
        <span className="line-clamp-4 text-ink-200">{rec.reasoning}</span>
      </blockquote>

      <div className="mt-auto flex items-center gap-1.5">
        <button
          onClick={() => addMut.mutate()}
          disabled={added || addMut.isPending}
          className={cn(
            "inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all duration-300",
            added
              ? "bg-emerald-600/20 text-emerald-300"
              : "bg-brand-600/20 text-brand-200 hover:bg-brand-600/30 hover:shadow-glow",
          )}
        >
          {added ? <Check className="h-3.5 w-3.5" /> : <BookPlus className="h-3.5 w-3.5" />}
          {added ? "On your shelf" : "Add to shelf"}
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
        "inline-flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-300",
        active ? activeClass : "text-ink-500 hover:bg-ink-800 hover:text-ink-300",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
