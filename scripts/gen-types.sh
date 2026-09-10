#!/bin/bash

# Generate Supabase TypeScript types for both the app and the Edge Functions.
# Pass --local to generate from the local database instead of the remote project.
# Pass --linked to generate from whichever project the Supabase CLI is currently
# linked to (e.g. staging, after `supabase link` in CI) instead of the hardcoded
# PROJECT_ID below.

set -euo pipefail

PROJECT_ID="qssmazlqrmxiudxckxvi"
APP_TYPES="src/integrations/supabase/types.ts"
EDGE_TYPES="supabase/functions/_shared/database.types.ts"

case "${1:-}" in
  --local)
    supabase gen types typescript --local | tee "$APP_TYPES" > "$EDGE_TYPES"
    ;;
  --linked)
    supabase gen types typescript --linked | tee "$APP_TYPES" > "$EDGE_TYPES"
    ;;
  *)
    supabase gen types typescript --project-id "$PROJECT_ID" | tee "$APP_TYPES" > "$EDGE_TYPES"
    ;;
esac
