import { Link } from "react-router-dom";
import { Quote } from "lucide-react";

import { Logo } from "@/components/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link to="/" className="w-fit">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-ink-400">{footer}</div>
          </div>
        </div>
      </div>

      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(50rem 40rem at 30% 20%, rgba(99,102,241,0.25), transparent), radial-gradient(40rem 30rem at 80% 80%, rgba(168,85,247,0.18), transparent)",
          }}
        />
        <div className="relative flex h-full flex-col justify-center px-12">
          <Quote className="mb-6 h-10 w-10 text-brand-400" />
          <p className="max-w-md font-serif text-2xl leading-relaxed text-ink-100">
            “A reader lives a thousand lives before he dies. The man who never reads lives only
            one.”
          </p>
          <p className="mt-4 text-sm text-ink-400">— George R.R. Martin</p>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-4">
            {[
              "from-indigo-500 to-purple-600",
              "from-rose-500 to-orange-500",
              "from-emerald-500 to-teal-600",
              "from-sky-500 to-blue-600",
              "from-fuchsia-500 to-pink-600",
              "from-amber-500 to-red-500",
            ].map((g, i) => (
              <div
                key={i}
                className={`aspect-[2/3] rounded-lg bg-gradient-to-br ${g} opacity-80 shadow-lg`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
