---
name: low-hanging-fruits
description: Find ready-for-agent GitHub issues that are safe to implement right now, and implement them in parallel via isolated worktree agents. Use when the user asks to "do a batch of low hanging fruit", "pick up ready-for-agent tickets", or similar.
---

# Low hanging fruits

Select a batch of standalone, unblocked `ready-for-agent` issues and implement
them in parallel, each in its own isolated worktree, each ending in a
self-reviewed PR.

## 1. List candidates

`list_issues` (or `search_issues`) for `chiptus/UpLine`, state `OPEN`, label
`ready-for-agent`.

## 2. Filter

Apply both filters before treating an issue as pickable. Do this for every
candidate, not just the ones that look busy.

**Skip WIP.** For each candidate issue `#n`, check `list_pull_requests` /
`search_pull_requests` (open, this repo) for a PR whose title or body
references `Closes #n` or `#n`. If one exists — even from a different
session — skip it. Don't open a second PR against an issue already in
flight.

**Skip epic subtasks by default.** An issue is a subtask if its body has a
`## Parent` line linking to another issue (the convention used in this repo
— e.g. `## Parent: chiptus/UpLine#122` or `## Parent: Epic #126`). Treat
these as _not_ standalone low-hanging fruit: surface them separately from
the batch and only include them if the user explicitly asks for epic work.
Sibling subtasks of the same epic tend to touch overlapping surfaces
(shared migrations, shared CI targets) and can collide when run in
parallel, so they need more coordination than a plain low-hanging-fruit
batch.

**Also check transitively.** Re-read each candidate's `## Blocked by`
section and verify every listed blocker issue is actually closed (don't
trust that a ticket labeled `ready-for-agent` has had its blockers
re-verified — labels go stale). An issue whose blocker just merged is fair
game; one whose blocker is still open is not, regardless of its own label.

## 3. Confirm the batch

Show the user the filtered list before launching anything: which issues made
the cut, which were skipped as WIP, which were skipped as epic subtasks, and
why. This is a multi-PR, multi-branch action — surface it, don't just go.

## 4. Implement in parallel

One `Agent` tool call per issue, all in a single message so they run
concurrently, each with `isolation: "worktree"`. Each agent's prompt should
include:

- The full issue body (title, what-to-build, acceptance criteria) — don't
  make the agent re-fetch it, paste it in.
- A branch name: `claude/issue-<n>-<short-slug>`.
- An instruction to read this repo's CLAUDE.md conventions before starting
  (function declarations, query/mutation naming, no barrel exports, etc).
- The full workflow: implement → commit → push → read
  `.claude/skills/create-pr/SKILL.md` and follow it exactly to open the PR
  (reference `Closes #<n>`) → invoke the `code-review` skill against the
  diff → apply confirmed fixes → report back the PR URL and a summary.

## 5. After launching

Background agents notify on completion — don't poll. When a PR opens,
webhook subscription (`subscribe_pr_activity`) picks up CI/review events
automatically if the session is already watching, or subscribe explicitly.

## Gotcha: don't work in the shared main directory while agents are running

`isolation: "worktree"` should give each agent its own directory under
`.claude/worktrees/agent-<id>`. In practice the shared main repo directory
(the one this session's own `Bash` calls default to) can end up checked out
onto an agent's branch too, with leftover staged changes from that
transition. If a stop-hook or `git status` reports uncommitted changes in
the shared directory that don't match what _you_ were doing there:

1. **Don't commit or push reflexively.** Investigate first — run
   `git worktree list` and check whether the same branch is checked out in
   both the shared directory and an agent's isolated worktree.
2. Check the isolated worktree's own `git status` — if it has real
   in-progress work, leave it alone.
3. If the shared directory's changes look like an accidental revert of
   already-merged content (not something you or the user authored), `git
stash push -u -m "..."` them (reversible, not a hard discard) and
   `git checkout` back to the session's actual designated branch.
4. Report what happened before doing anything else — this is exactly the
   kind of unexpected repo state the top-level safety rules say to
   investigate before touching.
