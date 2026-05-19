#!/usr/bin/env bash
#
# Recreate staging from scratch: reset schema, re-run every migration from
# the current branch, sync anonymized prod data, and clear admin_roles so
# you can bootstrap yourself.
#
# Usage:
#   pnpm run db:recreate:staging
#
# After it finishes:
#   1. Sign up on the staging UI with the email you want to be admin.
#   2. In the Supabase dashboard SQL editor (or psql against $STAGING_DB_URL):
#        SELECT public.bootstrap_super_admin('you@example.com');
#
# Required env vars (put them in scripts/.env.sync, which is gitignored):
#   STAGING_PROJECT_REF   Supabase project ref for staging
#   STAGING_DB_PASSWORD   Staging DB password (for `supabase link`)
#   STAGING_DB_URL        Direct postgres URL for staging
#   PROD_DB_URL           Direct postgres URL for prod
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.sync"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${STAGING_PROJECT_REF:?STAGING_PROJECT_REF is required}"
: "${STAGING_DB_PASSWORD:?STAGING_DB_PASSWORD is required}"
: "${STAGING_DB_URL:?STAGING_DB_URL is required}"
: "${PROD_DB_URL:?PROD_DB_URL is required}"

if [[ "$STAGING_DB_URL" == "$PROD_DB_URL" ]]; then
  echo "Refusing: STAGING_DB_URL equals PROD_DB_URL." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

cat <<MSG

This will:
  1. supabase link --project-ref $STAGING_PROJECT_REF
  2. supabase db reset --linked   (drops everything, re-runs migrations from branch '$BRANCH')
  3. sync anonymized prod data into staging
  4. truncate admin_roles so bootstrap_super_admin will accept your first call

It will NOT promote you to admin — sign up on staging UI first, then run
  SELECT public.bootstrap_super_admin('you@example.com');

MSG
read -r -p "Type 'yes' to continue: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted."
  exit 1
fi

echo "→ Linking to staging…"
supabase link --project-ref "$STAGING_PROJECT_REF" --password "$STAGING_DB_PASSWORD"

echo "→ Resetting staging DB…"
printf 'yes\n' | supabase db reset --linked

echo "→ Syncing prod data into staging…"
SKIP_CONFIRM=1 bash "$SCRIPT_DIR/sync-from-prod.sh" staging

echo "→ Clearing admin_roles…"
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 \
  -c "TRUNCATE TABLE public.admin_roles RESTART IDENTITY CASCADE;"

cat <<MSG

✓ Staging is reset, schema is up to date with branch '$BRANCH', and prod
  data is loaded (anonymized).

Next:
  1. Sign up on the staging UI with the email you want to be super admin.
  2. Run, in the staging SQL editor (or against \$STAGING_DB_URL):
       SELECT public.bootstrap_super_admin('you@example.com');

MSG
