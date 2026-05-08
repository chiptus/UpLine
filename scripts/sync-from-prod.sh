#!/usr/bin/env bash
#
# Sync production data into staging or local for testing.
#
# Usage:
#   pnpm run db:sync:staging
#   pnpm run db:sync:local
#
# What it does:
#   1. pg_dump the `public` schema (data only) from PROD_DB_URL.
#   2. TRUNCATE the target's public tables and restore the dump.
#   3. Run scripts/anonymize.sql against the target to scrub PII.
#   4. Leaves auth.users untouched on the target — create test users separately.
#
# Required env vars (put them in scripts/.env.sync, which is gitignored):
#   PROD_DB_URL      Postgres connection string for the prod project
#                    (Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI)
#   STAGING_DB_URL   Same, for the staging project
#   LOCAL_DB_URL     Defaults to the Supabase CLI local DB if unset
#
set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 <staging|local>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.sync"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${PROD_DB_URL:?PROD_DB_URL is required (see scripts/.env.sync.example)}"

case "$TARGET" in
  staging)
    : "${STAGING_DB_URL:?STAGING_DB_URL is required for staging sync}"
    TARGET_URL="$STAGING_DB_URL"
    ;;
  local)
    TARGET_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
    ;;
  *)
    echo "Unknown target: $TARGET (expected: staging | local)" >&2
    exit 1
    ;;
esac

if [[ "$TARGET_URL" == "$PROD_DB_URL" ]]; then
  echo "Refusing to run: target URL equals PROD_DB_URL." >&2
  exit 1
fi

echo "About to OVERWRITE the public schema in:"
echo "  $TARGET_URL"
echo "with data from prod."
read -r -p "Type 'yes' to continue: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted."
  exit 1
fi

DUMP_FILE="$(mktemp -t upline-prod-dump.XXXXXX.sql)"
trap 'rm -f "$DUMP_FILE"' EXIT

echo "Dumping public schema data from prod…"
pg_dump \
  --no-owner \
  --no-privileges \
  --data-only \
  --schema=public \
  --disable-triggers \
  --column-inserts=false \
  --file="$DUMP_FILE" \
  "$PROD_DB_URL"

echo "Truncating public tables in target…"
psql "$TARGET_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  stmt TEXT;
BEGIN
  SELECT 'TRUNCATE TABLE ' || string_agg(format('%I.%I', schemaname, tablename), ', ')
         || ' RESTART IDENTITY CASCADE'
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public';
  IF stmt IS NOT NULL THEN
    EXECUTE stmt;
  END IF;
END $$;
SQL

echo "Restoring dump into target…"
psql "$TARGET_URL" -v ON_ERROR_STOP=1 -f "$DUMP_FILE"

echo "Running anonymizer…"
psql "$TARGET_URL" -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/anonymize.sql"

echo "Done. Target has prod data with PII scrubbed."
echo "Note: auth.users on the target was not modified. Sign in there with"
echo "      whatever test accounts you've already created."
