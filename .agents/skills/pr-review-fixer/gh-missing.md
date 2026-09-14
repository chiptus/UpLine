# Fallback: gh is missing

Reached from `SKILL.md` only when Phase 1's `command -v gh` check comes back
empty (e.g. a remote/cloud session with no `gh` CLI, relying on the
`mcp__github__*` tools instead). Skip this file entirely when `gh` is available.

## Phase 1: fetch threads

Reconstruct the same `{threads, reviews, issueComments}` shape from
`mcp__github__pull_request_read` (owner/repo from the git remote, PR number for
the current branch — ask if it's ambiguous):

- `method: get_review_comments` → review threads. Each has `id` (the GraphQL
  thread node ID — this is what `resolve_review_thread` below needs, keep it),
  `is_resolved`, `path`, `line`, and `comments[]` with `author`/`body`. Keep
  only `is_resolved == false` — the tool doesn't filter this for you the way
  the script's `jq` does.
- `method: get_reviews` → review bodies; keep only non-empty `body`.
- `method: get_comments` → top-level PR/issue comments (the script's
  `issueComments`).

Everything from Phase 2 on reads `{threads, reviews, issueComments}` the same
way regardless of which path produced it.

## Phase 4: resolve and reply

- Resolve a thread with `mcp__github__resolve_review_thread`, passing the
  thread's GraphQL `id` (kept from `get_review_comments` above).
- A reply, if the user wants one posted:
  - Inline thread reply: `mcp__github__add_reply_to_pull_request_comment`
    with the numeric comment ID from the thread's comment `html_url` (the
    `#discussion_r<id>` suffix — not the thread's GraphQL `id`).
  - Top-level PR comment: `mcp__github__add_issue_comment`.
