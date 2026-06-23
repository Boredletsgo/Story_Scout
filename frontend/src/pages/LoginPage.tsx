import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { errorMessage } from "@/api/client";
import { Spinner } from "@/components/Spinner";
import { useAuthStore } from "@/store/auth";
import { AuthShell } from "./AuthShell";

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app";

  const [email, setEmail] = useState("demo@storyscout.ai");
  const [password, setPassword] = useState("storyscout123");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in and settle back in by the fire."
      footer={
        <>
          New to Story Scout?{" "}
          <Link to="/register" className="font-semibold text-brand-300 hover:text-brand-200">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-500 hover:text-ink-300"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? <Spinner className="h-4 w-4" /> : "Sign in"}
        </button>

        <p className="rounded-lg bg-ink-900 px-3 py-2 text-center text-xs text-ink-500">
          Demo account is pre-filled — just click <span className="text-ink-300">Sign in</span>.
        </p>
      </form>
    </AuthShell>
  );
}
