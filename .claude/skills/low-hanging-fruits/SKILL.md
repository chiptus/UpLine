---
name: low-hanging-fruits
description: Find ready-for-agent GitHub issues that are simple and unblocked, and hand off a ready-to-use prompt for implementing the confirmed batch in parallel. Use when the user asks to "do a batch of low hanging fruit", "pick up ready-for-agent tickets", or similar.
disable-model-invocation: true
---

# Low hanging fruits

Find a batch of standalone, unblocked, **simple** `ready-for-agent` issues,
confirm the batch with the user, then hand off a ready-to-use prompt for
implementing them. This skill only discovers and filters — it does not call
`Agent`/`Task` itself, and it does not implement anything. It stops at the
handoff prompt.

## 1. List candidates

`list_issues` (or `search_issues`) for `chiptus/UpLine`, state `OPEN`, label
`ready-for-agent`.

## 2. Filter

Apply every check below before treating an issue as pickable. Do this for
every candidate, not just the ones that look busy.

**Skip WIP.** For each candidate issue `#n`, check `list_pull_requests` /
`search_pull_requests` (open, this repo) for a PR whose title or body
references `Closes #n` or `#n`. If one exists — even from a different
session — skip it. Don't suggest a second implementation of an issue
already in flight.

**Skip epic subtasks by default.** An issue is a subtask if its body has a
`## Parent` line linking to another issue (the convention used in this repo
— e.g. `## Parent: chiptus/UpLine#122` or `## Parent: Epic #126`). Treat
these as _not_ standalone low-hanging fruit: surface them separately from
the batch and only include them if the user explicitly asks for epic work.
Sibling subtasks of the same epic tend to touch overlapping surfaces
(shared migrations, shared CI targets) and can collide when run in
parallel, so they need more coordination than a plain low-hanging-fruit
batch.

**Verify blockers transitively.** Re-read each candidate's `## Blocked by`
section and verify every listed blocker issue is actually closed (don't
trust that a ticket labeled `ready-for-agent` has had its blockers
re-verified — labels go stale). An issue whose blocker just merged is fair
game; one whose blocker is still open is not, regardless of its own label.

**Skip complex work.** `ready-for-agent` + unblocked is necessary but not
sufficient — low hanging fruit also means the resulting PR will be small,
fast to review, and unlikely to need drawn-out back-and-forth. This can
only be predicted from the issue body (there's no diff yet), so hard-skip
an issue if its description matches any of the following categories, even
if the prose reads as contained:

1. Requires a new/changed migration beyond adding a single column or index
   to an existing table. A plain `ALTER TABLE ... ADD COLUMN` (+ optional
   index) is fine; a new table, new RLS policy, or new enum is not.
2. Touches auth (login/session/magic-link/OTP flows).
3. Requires new test infrastructure or seed-data changes.
4. Introduces a new shared/cross-cutting primitive that other tickets are
   expected to build on.
5. Multi-view/multi-mode UI work — rendering N named states/levels/modes of
   the same screen.

These are one-line judgment calls, not keyword matches — apply them by
reading the issue, not by scanning for literal phrases. There's no
numeric backstop (e.g. acceptance-criteria bullet count) on top of this —
the confirmation step below is the real safety net, so this filter doesn't
need to be exhaustive.

## 3. Confirm the batch

Show the user the filtered list before doing anything else:

- Which issues made the cut.
- Which were skipped, and why — WIP, epic subtask, still blocked, or which
  complexity category. Don't silently drop anything.

Wait for the user's approval (or edits) of the batch.

## 4. Hand off

Once the user approves the batch, output a single ready-to-use prompt for
them to give to the next process — do not call `Agent`/`Task` yourself.
Shape:

```
/implement in parallel each of these issues on chiptus/UpLine: #xx, #xy, #xz.
Each issue in its own worktree and branch. Once an issue's implementation
finishes, run /create-pr and /code-review for it.
```

Substitute the approved issue numbers. This skill's job ends here.
