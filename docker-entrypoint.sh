#!/bin/sh
set -e

# Render's Blueprint wires the MariaDB service details in as discrete DB_*
# variables. Turn them into the DATABASE_URL format the app and Prisma expect.
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_HOST:-}" ]; then
  DATABASE_URL="$(DB_HOST="$DB_HOST" \
    DB_PORT="${DB_PORT:-3306}" \
    DB_USER="${DB_USER:-}" \
    DB_PASSWORD="${DB_PASSWORD:-}" \
    DB_NAME="${DB_NAME:-}" \
    node -e '
      const url = new URL("mysql://placeholder/");
      url.hostname = process.env.DB_HOST;
      url.port = process.env.DB_PORT || "3306";
      url.username = process.env.DB_USER;
      url.password = process.env.DB_PASSWORD;
      url.pathname = "/" + process.env.DB_NAME;
      process.stdout.write(url.toString());
    ')"
  export DATABASE_URL
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: set DATABASE_URL, or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME." >&2
  exit 1
fi

echo "==> Applying database migrations..."
npx prisma migrate deploy --config prisma.config.ts

echo "==> Starting application..."
exec "$@"
