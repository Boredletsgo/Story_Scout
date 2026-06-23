import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookCheck,
  BookOpen,
  Bookmark,
  Flame,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { dashboardApi, libraryApi } from "@/api/endpoints";
import type { DashboardStats } from "@/api/types";
import { BookCard } from "@/components/BookCard";
import { PageHeader } from "@/components/AppLayout";
import { FullPageSpinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const statsQuery = useQuery({ queryKey: ["dashboard", "stats"], queryFn: dashboardApi.stats });
  const coachQuery = useQuery({ queryKey: ["dashboard", "coach"], queryFn: dashboardApi.coach });
  const libraryQuery = useQuery({ queryKey: ["library", "all"], queryFn: () => libraryApi.list() });

  if (statsQuery.isLoading) {
    return <FullPageSpinner label="Crunching your reading stats…" />;
  }

  const stats = statsQuery.data;
  const recent = (libraryQuery.data ?? []).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(" ")[0] || user?.username || "reader"}`}
        subtitle="Here's your reading life at a glance."
        icon={LayoutDashboard}
        actions={
          <Link to="/app/chat" className="btn-primary">
            <MessageSquareText className="h-4 w-4" />
            Get recommendations
          </Link>
        }
      />

      {/* Coach banner */}
      {coachQuery.data ? (
        <div className="card mb-6 flex items-start gap-4 border-brand-800/50 bg-gradient-to-br from-brand-600/10 to-transparent p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/20 text-brand-300">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-200">Your reading coach</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-200">{coachQuery.data}</p>
          </div>
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookCheck}
          label="Books read"
          value={stats?.books_read ?? 0}
          accent="text-emerald-400"
        />
        <StatCard
          icon={BookOpen}
          label="Currently reading"
          value={stats?.currently_reading ?? 0}
          accent="text-sky-400"
        />
        <StatCard
          icon={Bookmark}
          label="Want to read"
          value={stats?.want_to_read ?? 0}
          accent="text-amber-400"
        />
        <StatCard
          icon={Flame}
          label="Day streak"
          value={stats?.reading_streak_days ?? 0}
          accent="text-rose-400"
        />
      </div>

      {/* Goal + accuracy */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GoalCard stats={stats} />
        <AccuracyCard stats={stats} />
      </div>

      {/* Recent library */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recently in your library</h2>
          <Link
            to="/app/library"
            className="inline-flex items-center gap-1 text-sm text-brand-300 hover:text-brand-200"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <BookOpen className="h-10 w-10 text-ink-600" />
            <div>
              <p className="font-medium text-ink-200">Your library is empty</p>
              <p className="mt-1 text-sm text-ink-500">
                Start a conversation to discover books you'll love.
              </p>
            </div>
            <Link to="/app/chat" className="btn-primary mt-1">
              <MessageSquareText className="h-4 w-4" />
              Find my next read
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recent.map((item) => (
              <BookCard key={item.id} book={item.book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <Icon className={cn("h-6 w-6", accent)} />
        <span className="text-3xl font-bold tabular-nums text-white">{value}</span>
      </div>
      <p className="mt-3 text-sm text-ink-400">{label}</p>
    </div>
  );
}

function GoalCard({ stats }: { stats?: DashboardStats }) {
  const pct = stats?.goal_progress_percent ?? 0;
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-brand-400" />
        <h3 className="font-semibold text-white">Reading goal</h3>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-sm text-ink-400">
          <span className="text-2xl font-bold text-white">{stats?.books_read ?? 0}</span> /{" "}
          {stats?.reading_goal_books ?? 0} books this year
        </p>
        <span className="text-sm font-semibold text-brand-300">{pct}%</span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function AccuracyCard({ stats }: { stats?: DashboardStats }) {
  const pct = Math.round((stats?.recommendation_accuracy ?? 0) * 100);
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        <h3 className="font-semibold text-white">Recommendation match</h3>
      </div>
      {stats && stats.total_feedback > 0 ? (
        <>
          <p className="text-sm text-ink-400">
            <span className="text-2xl font-bold text-white">{pct}%</span> of picks you rated were a
            hit
          </p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-500">
            Based on {stats.total_feedback} rating{stats.total_feedback === 1 ? "" : "s"}.
          </p>
        </>
      ) : (
        <p className="text-sm text-ink-500">
          Rate recommendations with 👍 / 👎 and we'll track how well BookMind learns your taste.
        </p>
      )}
    </div>
  );
}
