#!/bin/sh
set -e

if [ -n "${DATABASE_URL:-}" ]; then
  # Strip surrounding quotes and whitespace
  DATABASE_URL=$(echo "$DATABASE_URL" | sed -e 's/^[[:space:]]*["'\'']\{0,1\}//' -e 's/["'\'']\{0,1\}[[:space:]]*$//')
  export DATABASE_URL

  case "$DATABASE_URL" in
    mysql://*)
      echo "==> Syncing MySQL database schema in background..."
      (npx prisma db push --skip-generate --accept-data-loss && echo "✅ Database schema in sync") || echo "⚠️ prisma db push notice: will sync at runtime" &
      ;;
    *)
      echo "⚠️ WARNING: DATABASE_URL does not start with mysql://. Please verify DATABASE_URL in Render Environment settings." >&2
      ;;
  esac
else
  echo "⚠️ WARNING: DATABASE_URL is not set. Please set DATABASE_URL in environment settings." >&2
fi

echo "==> Starting application on 0.0.0.0:${PORT:-10000}..."
exec "$@"
