---
name: pr-review-fixer
description: >
  Fetch all unresolved PR review comments for the current branch, analyze each one,
  and plan concrete fixes. Then let the user choose what to address in free text,
  and implement the selected fixes. Use this skill whenever the user asks to "review
  PR comments", "address review feedback", "fix review comments", "what comments are
  on this PR", "respond to code review", or similar. Trigger even if they just say
  "let's fix the PR comments" or "what did reviewers say".
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/fetch-review-threads.sh) Bash(${CLAUDE_SKILL_DIR}/scripts/resolve-thread.sh *) Bash(gh pr comment *) Bash(command -v gh) mcp__github__pull_request_read mcp__github__resolve_review_thread mcp__github__add_reply_to_pull_request_comment mcp__github__add_issue_comment
---

# PR Review Comment Fixer

Fetch unresolved PR review threads, analyze each one, propose fixes, then implement
whatever the user approves.

## Phase 1: Fetch threads

Using the Bash tool yourself — not the auto-exec markdown form (an exclamation
mark immediately before a backtick-fenced command), which runs unconditionally
before you get a turn and is exactly what broke the branch below — check once
whether `gh` is on `PATH`: `command -v gh`. Some session types
(e.g. a remote/cloud session) have no `gh` CLI and rely on the `mcp__github__*`
tools instead. Don't discover this by running the fetch script and reacting to its
failure — check first, with this command, and pick the right path.

**`gh` available:** run `${CLAUDE_SKILL_DIR}/scripts/fetch-review-threads.sh` via
the Bash tool. It resolves the current PR, fetches review threads, review bodies,
and issue comments, and filters out resolved threads and empty bodies with `jq`
before any of it reaches you: you only ever see live, unresolved feedback. Output
is `{threads, reviews, issueComments}`.

**`gh` missing:** reconstruct the same `{threads, reviews, issueComments}` shape from
`mcp__github__pull_request_read` (owner/repo from the git remote, PR number for the
current branch — ask if it's ambiguous):

- `method: get_review_comments` → review threads. Each has `id` (the GraphQL thread
  node ID — this is what `resolve_review_thread` and Phase 4 need later, keep it),
  `is_resolved`, `path`, `line`, and `comments[]` with `author`/`body`. Keep only
  `is_resolved == false` — the tool doesn't filter this for you the way the script's
  `jq` does.
- `method: get_reviews` → review bodies; keep only non-empty `body`.
- `method: get_comments` → top-level PR/issue comments (the script's `issueComments`).

Everything from Phase 2 on reads `{threads, reviews, issueComments}` the same way
regardless of which path produced it.

If all three arrays are empty, tell the user and stop.

## Phase 2: Understand each comment

For each unresolved thread:

- Read the relevant file around the commented line (±20 lines of context). If the
  thread has no `line` (file-level comment), read the top of the file or the section
  being discussed.
- Understand what the reviewer is actually asking. Categorize by the _intent_, not the
  grammatical form: "should X be Y?" phrased as a question is still action-required
  if there is an implied change. Use:
  - **Action required**: a clear bug, style issue, explicit change request, or any
    "should X be Y?" that implies a rename/refactor
  - **Suggestion**: an optional improvement with no clear right/wrong answer
  - **Question**: only when the reviewer genuinely wants an explanation and no code
    change is implied (rare)
  - **Revert**: reviewer explicitly says "revert", "remove", or "this is out of scope"
- Draft a concrete, specific fix for action-required and revert items. For questions,
  draft a brief answer. For suggestions, note whether it's worth doing.
- Estimate size: `small` (a few lines), `medium` (one function/file), `large`
  (multi-file or requires new design).

## Phase 3: Present the analysis

Before listing, look for **related cascades**: comments that all stem from the same
root change (e.g. an API refactor and all its call-site follow-ons). Group these
under a shared heading and give them a single number (e.g. "Group 3: revert
useSearch API change (5 files)") so the user can approve the whole cascade as one
decision.

Output a numbered list. Standalone items:

```
## Comment N: <type> | <size>
**File:** path/to/file.ts (line X)
**Reviewer:** @username

> <exact quote of the comment body>

**Analysis:** <1-2 sentences: what they mean and why it matters>
**Proposed fix:** <concrete description of what to change>
```

Cascade groups:

```
## Group N: <theme> | <size> (<M> files)
**Reviewer:** @username

> <quote from the root comment>

**Analysis:** <why these are linked>
**Proposed fix:** <single description covering all files in the group>
  - file-a.ts line X: ...
  - file-b.ts line Y: ...
```

After the list, ask:

> "Which of these would you like me to address? (e.g. "fix 1, 2, 4" or "all" or
> "skip 3, fix the rest") For large ones I'll flag if they need a separate session."

Stop the turn here and wait for the user's reply, even when there is only one comment
and the fix looks obvious. Do not answer on the user's behalf.

## Phase 4: Implement

Parse the user's free-text reply to determine which comments to fix. Be flexible:
"do everything", "just 1 and 3", "all except 5", "skip the big ones" are all valid.

For each selected comment:

- If `small` or `medium`: implement the fix now. After editing, confirm with a brief
  "Fixed #N: [what changed]" note. Then resolve the thread — `gh` available:
  ```bash
  ${CLAUDE_SKILL_DIR}/scripts/resolve-thread.sh <thread-id>
  ```
  `gh` missing: `mcp__github__resolve_review_thread` with that same thread ID (the
  `id` field kept from Phase 1's `get_review_comments`).
  (Only resolve inline threads; top-level review bodies and issue comments don't have
  a thread ID to resolve.)
- If `large`: don't attempt it now. Say: "Comment N is too large for this session:
  suggest tackling it in a dedicated follow-up." Do not resolve the thread.
- If the comment is a **question**: no code change needed. Explain the answer
  (optionally posted as a reply, if the user wants it posted, but don't do this unless
  asked — `gh` available: `gh pr comment --body ...`; `gh` missing: an inline thread
  reply is `mcp__github__add_reply_to_pull_request_comment` with the numeric comment
  ID from the thread's comment `html_url` (the `#discussion_r<id>` suffix, not the
  thread's GraphQL `id`), and a top-level PR comment is `mcp__github__add_issue_comment`).
  Resolve the thread after answering.

After all fixes are applied, give a short summary of what was changed and what was
deferred.

## Notes

- When two comments touch the same function, batch them into one edit.
- If a fix would break existing tests, mention it before proceeding.
- Don't create new files unless the fix explicitly requires it.
- Don't fix issues not mentioned in the comments; stay scoped.
