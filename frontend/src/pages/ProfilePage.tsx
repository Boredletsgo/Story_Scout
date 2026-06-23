import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Save, Sparkles, User2 } from "lucide-react";

import { errorMessage } from "@/api/client";
import { systemApi, userApi } from "@/api/endpoints";
import type { Preference, User } from "@/api/types";
import { PageHeader } from "@/components/AppLayout";
import { FullPageSpinner, Spinner } from "@/components/Spinner";
import { useAuthStore } from "@/store/auth";

const GENRE_OPTIONS = [
  "Fantasy",
  "Science Fiction",
  "Romance",
  "Mystery",
  "Thriller",
  "Historical Fiction",
  "Literary Fiction",
  "Horror",
  "Young Adult",
  "Non-Fiction",
];

const MOOD_OPTIONS = [
  "Cozy",
  "Dark",
  "Hopeful",
  "Adventurous",
  "Emotional",
  "Funny",
  "Suspenseful",
  "Thought-provoking",
];

export function ProfilePage() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const userQuery = useQuery({ queryKey: ["users", "me"], queryFn: userApi.me });
  const prefQuery = useQuery({ queryKey: ["users", "preferences"], queryFn: userApi.getPreferences });
  const infoQuery = useQuery({ queryKey: ["system", "info"], queryFn: systemApi.info });

  if (userQuery.isLoading || prefQuery.isLoading) {
    return <FullPageSpinner label="Loading your profile…" />;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader title="Profile & preferences" subtitle="Tune how Story Scout understands you." icon={User2} />

      <div className="space-y-6">
        {userQuery.data ? (
          <ProfileForm
            user={userQuery.data}
            onSaved={(u) => {
              setUser(u);
              queryClient.invalidateQueries({ queryKey: ["users"] });
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            }}
          />
        ) : null}

        {prefQuery.data ? (
          <PreferencesForm
            pref={prefQuery.data}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ["users", "preferences"] });
            }}
          />
        ) : null}

        {/* System info */}
        {infoQuery.data ? (
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-400" />
              <h3 className="font-semibold text-white">Engine</h3>
            </div>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <Info label="LLM provider" value={infoQuery.data.llm_provider} />
              <Info label="Model" value={infoQuery.data.llm_model} />
              <Info label="Embeddings" value={infoQuery.data.embedding_model} />
              <Info label="Books indexed" value={String(infoQuery.data.indexed_books)} />
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProfileForm({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [readingLevel, setReadingLevel] = useState(user.reading_level ?? "");
  const [goal, setGoal] = useState(user.reading_goal_books);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      userApi.updateMe({
        full_name: fullName || null,
        reading_level: readingLevel || null,
        reading_goal_books: goal,
      }),
    onSuccess: (u) => {
      onSaved(u);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        mut.mutate();
      }}
      className="card space-y-4 p-6"
    >
      <h3 className="font-semibold text-white">Account</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Username</label>
          <input value={user.username} disabled className="input opacity-60" />
        </div>
        <div>
          <label className="label">Email</label>
          <input value={user.email} disabled className="input opacity-60" />
        </div>
        <div>
          <label className="label">Reading level</label>
          <select
            value={readingLevel}
            onChange={(e) => setReadingLevel(e.target.value)}
            className="input"
          >
            <option value="">Not set</option>
            <option value="casual">Casual</option>
            <option value="avid">Avid</option>
            <option value="voracious">Voracious</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Yearly reading goal: {goal} books</label>
        <input
          type="range"
          min={1}
          max={100}
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <button type="submit" disabled={mut.isPending} className="btn-primary">
        {mut.isPending ? (
          <Spinner className="h-4 w-4" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saved ? "Saved" : "Save changes"}
      </button>
    </form>
  );
}

function PreferencesForm({ pref, onSaved }: { pref: Preference; onSaved: () => void }) {
  const [genres, setGenres] = useState<string[]>(pref.favorite_genres);
  const [moods, setMoods] = useState<string[]>(pref.preferred_moods);
  const [saved, setSaved] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      userApi.updatePreferences({ favorite_genres: genres, preferred_moods: moods }),
    onSuccess: () => {
      onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const toggle = (
    value: string,
    list: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
      className="card space-y-5 p-6"
    >
      <div>
        <h3 className="font-semibold text-white">Taste profile</h3>
        <p className="mt-1 text-sm text-ink-400">
          These guide your recommendations. Story Scout also learns from your chats and ratings.
        </p>
      </div>

      <ChipGroup
        label="Favorite genres"
        options={GENRE_OPTIONS}
        selected={genres}
        onToggle={(v) => toggle(v, genres, setGenres)}
      />
      <ChipGroup
        label="Preferred moods"
        options={MOOD_OPTIONS}
        selected={moods}
        onToggle={(v) => toggle(v, moods, setMoods)}
      />

      {pref.profile_summary ? (
        <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            What we've learned
          </p>
          <p className="mt-1 text-sm text-ink-300">{pref.profile_summary}</p>
        </div>
      ) : null}

      <button type="submit" disabled={mut.isPending} className="btn-primary">
        {mut.isPending ? (
          <Spinner className="h-4 w-4" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saved ? "Saved" : "Save preferences"}
      </button>
    </form>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={
                active
                  ? "inline-flex items-center gap-1 rounded-full border border-brand-500 bg-brand-600/20 px-3 py-1.5 text-sm font-medium text-brand-200 transition"
                  : "inline-flex items-center gap-1 rounded-full border border-ink-700 bg-ink-800/60 px-3 py-1.5 text-sm text-ink-300 transition hover:border-ink-600"
              }
            >
              {active ? <Check className="h-3.5 w-3.5" /> : null}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-200">{value}</dd>
    </>
  );
}
