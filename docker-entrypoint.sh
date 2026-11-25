#!/bin/sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  echo "⚠️ WARNING: DATABASE_URL is not set. Please set DATABASE_URL in environment settings." >&2
else
  echo "==> Deploying MySQL schema..."
  npx prisma db push --skip-generate || echo "⚠️ prisma db push failed (will retry at runtime)"
fi

echo "==> Starting application..."
exec "$@"
