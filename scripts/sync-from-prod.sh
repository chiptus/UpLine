#!/usr/bin/env bash
#
# Sync production data into staging or local for testing.
#
# Usage:
#   pnpm run db:sync:staging
#   pnpm run db:sync:local
#
# What it does:
#   1. Sync auth.users from prod into target. Existing target users are preserved
#      (ON CONFLICT DO NOTHING); newly inserted rows have their emails rewritten
#      to user-<short-id>@example.test, no password, no OAuth metadata.
#   2. pg_dump the `public` schema (data only) from PROD_DB_URL, TRUNCATE the
#      target's public tables, and restore the dump.
#   3. Run scripts/anonymize.sql against the target to scrub remaining PII in
#      the public schema.
#
# Required env vars (put them in scripts/.env.sync, which is gitignored):
#   PROD_DB_URL      Postgres connection string for the prod project
#                    (Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI)
#   STAGING_DB_URL   Same, for the staging project
#   LOCAL_DB_URL     Defaults to the Supabase CLI local DB if unset
#
# Skip auth syncing with: SYNC_AUTH=0 pnpm run db:sync:staging
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
SYNC_AUTH="${SYNC_AUTH:-1}"

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
if [[ "$SYNC_AUTH" == "1" ]]; then
  echo "and upsert anonymized auth.users from prod (existing target users kept)."
fi
read -r -p "Type 'yes' to continue: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted."
  exit 1
fi

TMP_DIR="$(mktemp -d -t upline-sync.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

if [[ "$SYNC_AUTH" == "1" ]]; then
  echo "Syncing auth.users from prod (anonymized)…"
  AUTH_CSV="$TMP_DIR/auth-users.csv"

  psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -c "\copy (SELECT id, email, email_confirmed_at, created_at, updated_at, aud, role FROM auth.users) TO '$AUTH_CSV' WITH (FORMAT csv)"

  psql "$TARGET_URL" -v ON_ERROR_STOP=1 <<SQL
CREATE TEMP TABLE _sync_auth_users (
  id uuid PRIMARY KEY,
  email varchar,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  aud varchar,
  role varchar
);

\copy _sync_auth_users FROM '$AUTH_CSV' WITH (FORMAT csv)

INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  s.id,
  COALESCE(s.aud, 'authenticated'),
  COALESCE(s.role, 'authenticated'),
  'user-' || substring(s.id::text, 1, 8) || '@example.test',
  s.email_confirmed_at,
  s.created_at,
  s.updated_at,
  '{"provider":"synced","providers":["synced"]}'::jsonb,
  '{}'::jsonb,
  false
FROM _sync_auth_users s
ON CONFLICT (id) DO NOTHING;
SQL
fi

echo "Dumping public schema data from prod…"
DUMP_FILE="$TMP_DIR/public-dump.sql"
pg_dump \
  --no-owner \
  --no-privileges \
  --data-only \
  --schema=public \
  --disable-triggers \
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

echo "Running anonymizer on public schema…"
psql "$TARGET_URL" -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/anonymize.sql"

echo "Done."
if [[ "$SYNC_AUTH" == "1" ]]; then
  echo "auth.users: synced rows have anonymized emails (user-<id>@example.test)"
  echo "  with no password — they exist for FK integrity, not for sign-in."
  echo "  Existing test accounts on the target were preserved."
fi
