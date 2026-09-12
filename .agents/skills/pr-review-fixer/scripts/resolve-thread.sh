#!/usr/bin/env bash
# Resolves a single PR review thread by ID.
# Usage: resolve-thread.sh <thread-id>
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: resolve-thread.sh <thread-id>" >&2
  exit 1
fi

thread_id="$1"

gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: {threadId: $threadId}) { thread { id } }
  }' -F threadId="$thread_id" >/dev/null
