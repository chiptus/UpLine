#!/usr/bin/env bash
#
# Recreate staging from scratch: reset schema, re-run every migration from
# the current branch, sync anonymized prod data, create your admin user, and
# promote it to super_admin.
#
# Usage:
#   pnpm run db:recreate:staging you@example.com
#
# Password: set ADMIN_PASSWORD to choose your own, otherwise one is generated
# and printed at the end.
#
# Required env vars (put them in scripts/.env.sync, which is gitignored):
#   STAGING_PROJECT_REF      Supabase project ref for staging
#   STAGING_DB_PASSWORD      Staging DB password (for `supabase link`)
#   STAGING_DB_URL           Direct postgres URL for staging
#   PROD_DB_URL              Direct postgres URL for prod
#   STAGING_URL              Staging project URL (https://<ref>.supabase.co)
#   STAGING_SERVICE_ROLE_KEY Staging service role key (for the admin Auth API)
#
set -euo pipefail

ADMIN_EMAIL="${1:-}"
if [[ -z "$ADMIN_EMAIL" ]]; then
  echo "Usage: $0 <admin-email>" >&2
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

: "${STAGING_PROJECT_REF:?STAGING_PROJECT_REF is required}"
: "${STAGING_DB_PASSWORD:?STAGING_DB_PASSWORD is required}"
: "${STAGING_DB_URL:?STAGING_DB_URL is required}"
: "${PROD_DB_URL:?PROD_DB_URL is required}"
: "${STAGING_URL:?STAGING_URL is required}"
: "${STAGING_SERVICE_ROLE_KEY:?STAGING_SERVICE_ROLE_KEY is required}"

if [[ "$STAGING_DB_URL" == "$PROD_DB_URL" ]]; then
  echo "Refusing: STAGING_DB_URL equals PROD_DB_URL." >&2
  exit 1
fi

ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
GENERATED_PASSWORD=0
if [[ -z "$ADMIN_PASSWORD" ]]; then
  ADMIN_PASSWORD="$(openssl rand -base64 18)"
  GENERATED_PASSWORD=1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

cat <<MSG

This will:
  1. supabase link --project-ref $STAGING_PROJECT_REF
  2. supabase db reset --linked   (drops everything, re-runs migrations from branch '$BRANCH')
  3. sync anonymized prod data into staging
  4. truncate admin_roles
  5. create the auth user '$ADMIN_EMAIL' and promote it to super_admin

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

echo "→ Creating admin auth user '$ADMIN_EMAIL'…"
CREATE_RESPONSE="$(
  curl -sS -X POST "$STAGING_URL/auth/v1/admin/users" \
    -H "apikey: $STAGING_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $STAGING_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "$(ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" python3 -c '
import json, os
print(json.dumps({
    "email": os.environ["ADMIN_EMAIL"],
    "password": os.environ["ADMIN_PASSWORD"],
    "email_confirm": True,
}))')"
)"

USER_ID="$(printf '%s' "$CREATE_RESPONSE" | python3 -c '
import sys, json
try:
    print(json.load(sys.stdin).get("id", ""))
except Exception:
    print("")
')"

if [[ -z "$USER_ID" ]]; then
  # Re-running the script: the user may already exist, which is fine —
  # bootstrap resolves by email. Any other failure is fatal.
  if printf '%s' "$CREATE_RESPONSE" | grep -qi "registered\|already exists"; then
    echo "  user already exists — keeping it."
    GENERATED_PASSWORD=0
  else
    echo "Failed to create admin user:" >&2
    echo "$CREATE_RESPONSE" >&2
    exit 1
  fi
fi

echo "→ Promoting '$ADMIN_EMAIL' to super_admin…"
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 \
  -c "SELECT public.bootstrap_super_admin('$ADMIN_EMAIL');"

cat <<MSG

✓ Staging reset to branch '$BRANCH', prod data loaded (anonymized),
  and '$ADMIN_EMAIL' is now super_admin.
MSG

if [[ "$GENERATED_PASSWORD" == "1" ]]; then
  cat <<MSG

  Generated password for $ADMIN_EMAIL:
      $ADMIN_PASSWORD
  Sign in with email + password, or use a magic link.
MSG
fi
