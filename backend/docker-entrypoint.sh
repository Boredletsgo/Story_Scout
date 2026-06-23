#!/usr/bin/env bash
# ===========================================================================
# Story Scout - backend container entrypoint
# Waits for Postgres, applies migrations, optionally seeds, then runs the app.
# ===========================================================================
set -euo pipefail

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

echo "[entrypoint] Waiting for Postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
ATTEMPTS=0
until python -c "import socket,sys; s=socket.socket(); s.settimeout(2); s.connect(('${POSTGRES_HOST}', ${POSTGRES_PORT})); s.close()" 2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "${ATTEMPTS}" -ge 30 ]; then
    echo "[entrypoint] ERROR: Postgres did not become available in time." >&2
    exit 1
  fi
  sleep 2
done
echo "[entrypoint] Postgres is up."

echo "[entrypoint] Applying database migrations..."
alembic upgrade head

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "[entrypoint] Seeding initial data (idempotent)..."
  python -m scripts.seed || echo "[entrypoint] Seed step reported a non-zero exit (continuing)."
fi

echo "[entrypoint] Starting: $*"
exec "$@"
