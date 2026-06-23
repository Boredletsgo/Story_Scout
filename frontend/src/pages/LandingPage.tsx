import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  Github,
  Library,
  MessageSquareText,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Discovery by conversation",
    body: "Describe a mood, a vibe, or a book you adored. The Scout asks the right follow-ups and pulls titles that truly fit.",
  },
  {
    icon: BrainCircuit,
    title: "Thoughtful reasoning",
    body: "A quiet circle of specialized agents reads your taste, gathers candidates, weighs them, and explains every choice.",
  },
  {
    icon: Wand2,
    title: "Picks you can trust",
    body: "No black boxes — every recommendation arrives with an Archivist's Note explaining why it's for you.",
  },
  {
    icon: Library,
    title: "Your reading life, kept warm",
    body: "Track what you're reading, longing to read, and finished — and watch your taste profile deepen over time.",
  },
];

const STEPS = [
  { n: "01", title: "Tell the Scout your mood", body: "“Something cozy with a slow-burn romance and a found family.”" },
  { n: "02", title: "The Scout wanders the stacks", body: "Taste-reading, retrieval, critique, and a hand-written reason — in moments." },
  { n: "03", title: "Curl up with picks you'll love", body: "Curated recommendations with reasons, ready to slip onto your shelf." },
];

export function LandingPage() {
  return (
    <div className="min-h-full bg-ink-950">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-ink-800/60 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="flex items-center gap-2">
            <ThemeSwitcher className="mr-1 hidden sm:inline-flex" />
            <Link to="/login" className="btn-ghost">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(60rem 40rem at 70% -10%, rgba(229,169,60,0.16), transparent), radial-gradient(40rem 30rem at 10% 20%, rgba(163,147,235,0.10), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip mx-auto mb-6 w-fit border-brand-700/50 bg-brand-600/10 text-brand-200">
              <Sparkles className="h-3.5 w-3.5" />
              Your cozy reading companion
            </span>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-ink-50 sm:text-6xl">
              Find your next favorite book{" "}
              <span className="bg-gradient-to-r from-brand-300 to-mist-400 bg-clip-text text-transparent">
                by the fire
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg font-serif text-ink-300">
              Story Scout turns a quiet chat into perfectly matched recommendations. Tell it the
              world you want to escape into — it wanders the stacks and brings stories home.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register" className="btn-primary px-6 py-3 text-base">
                Start discovering free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="btn-secondary px-6 py-3 text-base">
                I already have an account
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink-500">
              Runs fully offline with open-source models — or bring your own OpenAI / Anthropic key.
            </p>
          </div>

          {/* Mock chat preview */}
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-ink-800 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs text-ink-500">Story Scout — by the Hearth</span>
              </div>
              <div className="space-y-4 p-5 text-sm">
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-white">
                    I want something like The Song of Achilles but with a happier ending.
                  </p>
                </div>
                <div className="flex justify-start">
                  <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-ink-800 px-4 py-2.5 text-ink-100">
                    Lovely taste! Lyrical mythology with emotional payoff — here are three picks
                    with bittersweet-but-hopeful endings, each with a reason you'll love it. 📚
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {["Circe", "Ariadne", "The Witch's Heart"].map((t, i) => (
                    <div
                      key={t}
                      className={`flex aspect-[2/3] flex-col items-center justify-center rounded-lg bg-gradient-to-br p-2 text-center ${
                        ["from-indigo-500 to-purple-600", "from-rose-500 to-orange-500", "from-emerald-500 to-teal-600"][i]
                      }`}
                    >
                      <span className="font-serif text-xs font-semibold text-white">{t}</span>
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-white/90">
                        <Star className="h-3 w-3 fill-white/90" /> 4.{6 - i}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink-50">
            Not just search. Understanding.
          </h2>
          <p className="mt-3 font-serif text-ink-400">
            Story Scout listens for why you love what you love — and recommends accordingly.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15 text-brand-300">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-ink-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-ink-800/60 bg-ink-900/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-white">
            How it works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span className="mb-3 block bg-gradient-to-r from-brand-400 to-fuchsia-400 bg-clip-text font-mono text-4xl font-extrabold text-transparent">
                  {s.n}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ink-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="card relative overflow-hidden p-10 text-center sm:p-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(40rem 20rem at 50% 0%, rgba(229,169,60,0.18), transparent)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your next great read is one conversation away.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-300">
              Join readers who've stopped scrolling endless lists and started getting picks that
              feel hand-chosen.
            </p>
            <Link
              to="/register"
              className="btn-primary mt-8 px-7 py-3 text-base"
            >
              Create your free account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-800/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-ink-500 sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} Story Scout. Find your next favorite book by the fire.</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 transition hover:text-ink-300"
          >
            <Github className="h-4 w-4" />
            Open source
          </a>
        </div>
      </footer>
    </div>
  );
}
