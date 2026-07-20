---
name: pr-review-fixer
description: >
  Fetch all unresolved PR review comments for the current branch, analyze each one,
  and plan concrete fixes. Then let the user choose what to address in free text —
  and implement the selected fixes. Use this skill whenever the user asks to "review
  PR comments", "address review feedback", "fix review comments", "what comments are
  on this PR", "respond to code review", or similar. Trigger even if they just say
  "let's fix the PR comments" or "what did reviewers say".
---

# PR Review Comment Fixer

Fetch unresolved PR review threads, analyze each one, propose fixes, then implement
whatever the user approves.

## Phase 1 — Fetch threads

1. Get the current PR number and repo:

   ```bash
   gh pr view --json number,url,headRefName,baseRefName
   ```

   Extract `owner` and `repo` from the URL (e.g. `https://github.com/owner/repo/pull/N`).

2. Fetch all review threads and top-level review bodies in one GraphQL call:

   ```bash
   gh api graphql -f query='
   {
     repository(owner:"OWNER", name:"REPO") {
       pullRequest(number: NUMBER) {
         reviewThreads(first: 100) {
           nodes {
             id
             isResolved
             path
             line
             startLine
             comments(first: 10) {
               nodes {
                 author { login }
                 body
                 createdAt
               }
             }
           }
         }
         reviews(first: 50) {
           nodes {
             id
             author { login }
             body
             state
             submittedAt
           }
         }
       }
     }
   }'
   ```

   Also fetch issue-level (non-review) comments:

   ```bash
   gh api repos/OWNER/REPO/issues/NUMBER/comments
   ```

3. Filter to unresolved: keep inline threads where `isResolved: false`, top-level
   review bodies that are non-empty, and issue comments. If nothing remains, tell
   the user and stop.

## Phase 2 — Understand each comment

For each unresolved thread:

- Read the relevant file around the commented line (±20 lines of context). If the
  thread has no `line` (file-level comment), read the top of the file or the section
  being discussed.
- Understand what the reviewer is actually asking. Categorize by the _intent_, not the
  grammatical form — "should X be Y?" phrased as a question is still action-required
  if there is an implied change. Use:
  - **Action required** — a clear bug, style issue, explicit change request, or any
    "should X be Y?" that implies a rename/refactor
  - **Suggestion** — an optional improvement with no clear right/wrong answer
  - **Question** — only when the reviewer genuinely wants an explanation and no code
    change is implied (rare)
  - **Revert** — reviewer explicitly says "revert", "remove", or "this is out of scope"
- Draft a concrete, specific fix for action-required and revert items. For questions,
  draft a brief answer. For suggestions, note whether it's worth doing.
- Estimate size: `small` (a few lines), `medium` (one function/file), `large`
  (multi-file or requires new design).

## Phase 3 — Present the analysis

Before listing, look for **related cascades** — comments that all stem from the same
root change (e.g. an API refactor and all its call-site follow-ons). Group these
under a shared heading and give them a single number (e.g. "Group 3 — revert
useSearch API change (5 files)") so the user can approve the whole cascade as one
decision.

Output a numbered list. Standalone items:

```
## Comment N — <type> | <size>
**File:** path/to/file.ts (line X)
**Reviewer:** @username

> <exact quote of the comment body>

**Analysis:** <1-2 sentences: what they mean and why it matters>
**Proposed fix:** <concrete description of what to change>
```

Cascade groups:

```
## Group N — <theme> | <size> (<M> files)
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

## Phase 4 — Implement

Parse the user's free-text reply to determine which comments to fix. Be flexible —
"do everything", "just 1 and 3", "all except 5", "skip the big ones" are all valid.

For each selected comment:

- If `small` or `medium`: implement the fix now. After editing, confirm with a brief
  "Fixed #N — [what changed]" note. Then resolve the thread:
  ```bash
  gh pr-review threads resolve --pr <pr-id> --thread-id <id>
  ```
  (Only resolve inline threads; top-level review bodies and issue comments don't have
  a thread ID to resolve.)
- If `large`: don't attempt it now. Say: "Comment N is too large for this session —
  suggest tackling it in a dedicated follow-up." Do not resolve the thread.
- If the comment is a **question**: no code change needed. Explain the answer
  (optionally as a reply via `gh pr-review review --add-comment` if the user wants
  to post it, but don't do this unless asked). Resolve the thread after answering.

After all fixes are applied, give a short summary of what was changed and what was
deferred.

## Notes

- Read files before editing — never guess at content.
- When two comments touch the same function, batch them into one edit.
- If a fix would break existing tests, mention it before proceeding.
- Don't create new files unless the fix explicitly requires it.
- Don't fix issues not mentioned in the comments; stay scoped.
