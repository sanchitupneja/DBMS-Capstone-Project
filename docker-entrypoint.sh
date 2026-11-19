#!/bin/sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  echo "⚠️ WARNING: DATABASE_URL is not set. Please set DATABASE_URL in Render dashboard." >&2
else
  case "$DATABASE_URL" in
    mongodb://*|mongodb+srv://*)
      echo "==> Syncing MongoDB schema..."
      npx prisma db push --skip-generate || echo "⚠️ prisma db push failed (will retry at runtime)"
      ;;
    *)
      echo "⚠️ WARNING: DATABASE_URL must be a mongodb:// or mongodb+srv:// URI." >&2
      ;;
  esac
fi

echo "==> Starting application..."
exec "$@"
