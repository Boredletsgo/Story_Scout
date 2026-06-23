import { Link } from "react-router-dom";
import { BookX } from "lucide-react";

import { Logo } from "@/components/Logo";

export function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 text-center">
      <Logo withWordmark={false} className="mb-6 scale-150" />
      <BookX className="mb-4 h-12 w-12 text-ink-600" />
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="mt-2 max-w-sm text-ink-400">
        This page seems to have wandered off into another story.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/app" className="btn-primary">
          Go to dashboard
        </Link>
        <Link to="/" className="btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
