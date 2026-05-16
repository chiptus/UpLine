#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?required}"
: "${PR:?required}"
: "${REPO:?required}"
: "${RUN_URL:?required}"
: "${TARGET:?required}"
: "${MIGRATE_RESULT:?required}"
: "${FUNCTIONS_RESULT:?required}"

MARKER="<!-- deploy-status -->"

line() {
  local name="$1" result="$2"
  case "$result" in
    success)    echo "- ✅ **$name** succeeded" ;;
    failure)    echo "- ❌ **$name** failed" ;;
    cancelled)  echo "- ⚪ **$name** cancelled" ;;
    skipped|"") echo "- ⏭️ **$name** skipped (no changes)" ;;
    *)          echo "- ❔ **$name**: $result" ;;
  esac
}

{
  echo "$MARKER"
  echo "**Deploy → \`$TARGET\`** — [workflow run]($RUN_URL)"
  echo ""
  line "DB migrations" "$MIGRATE_RESULT"
  line "Edge functions" "$FUNCTIONS_RESULT"
} > body.md

EXISTING=$(gh api "repos/$REPO/issues/$PR/comments" --jq ".[] | select(.body | contains(\"$MARKER\")) | .id" | head -n1)

if [[ -n "$EXISTING" ]]; then
  gh api -X PATCH "repos/$REPO/issues/comments/$EXISTING" -F body=@body.md
else
  gh pr comment "$PR" --repo "$REPO" --body-file body.md
fi
