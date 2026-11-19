#!/bin/sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL (MongoDB connection string) is required." >&2
  exit 1
fi

case "$DATABASE_URL" in
  mongodb://*|mongodb+srv://*) ;;
  *)
    echo "ERROR: DATABASE_URL must be a mongodb:// or mongodb+srv:// URI." >&2
    exit 1
    ;;
esac

# MongoDB has no Prisma Migrate. `db push` creates/updates collections,
# unique indexes and is safe to re-run on every start.
echo "==> Syncing MongoDB schema..."
npx prisma db push --skip-generate

echo "==> Starting application..."
exec "$@"
