#!/bin/bash

# Generate Supabase TypeScript types for both the app and the Edge Functions.
# Pass --local to generate from the local database instead of the remote project.

set -euo pipefail

PROJECT_ID="qssmazlqrmxiudxckxvi"
APP_TYPES="src/integrations/supabase/types.ts"
EDGE_TYPES="supabase/functions/_shared/database.types.ts"

if [[ "${1:-}" == "--local" ]]; then
  supabase gen types typescript --local | tee "$APP_TYPES" > "$EDGE_TYPES"
else
  supabase gen types typescript --project-id "$PROJECT_ID" | tee "$APP_TYPES" > "$EDGE_TYPES"
fi
