#!/bin/sh
set -e

if [ -n "${DATABASE_URL:-}" ]; then
  echo "==> Syncing database schema in background..."
  (npx prisma db push --skip-generate --accept-data-loss && echo "✅ Database schema in sync") || echo "⚠️ prisma db push notice: will sync at runtime" &
else
  echo "⚠️ WARNING: DATABASE_URL is not set. Please set DATABASE_URL in environment settings." >&2
fi

echo "==> Starting application on 0.0.0.0:${PORT:-10000}..."
exec "$@"
