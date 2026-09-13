# Handoff: setup-chiptus-env needs a discussion pass, not more incremental edits

## Context

This session iterated heavily on `.claude/skills/setup-chiptus-env/` (a new
user-invoked skill: install `setup-matt-pocock-skills` if missing, run it,
optionally relocate `docs/agents/` externally, then scaffold
`docs/agents/autonomic-issues.md`). All work is on branch
`docs/triage-labels-git-conventions`, open as
https://github.com/chiptus/UpLine/pull/498 — every commit message on that
branch documents one step of the reasoning; read `git log` there rather than
this doc restating diffs.

The pattern worth noticing: the design of `autonomic-issues.md` (the
per-repo pipeline template) went through **four different shapes** in one
session, each prompted by the user pushing back on the previous one:

1. Two full parallel files (`autonomic-issues-github.md` /
   `-linear.md`) — ~90% duplicated boilerplate.
2. One file with `<!-- tracker:github -->` / `<!-- tracker:linear -->`
   markers interleaved through every section — didn't scale past 2 trackers
   (adding a 3rd means editing every section).
3. A skeleton file + small per-tracker fragment files, five named slots
   (`{{INTRO}}`, `{{SHARED_STATE}}`, etc.) — still full paragraphs
   duplicated per tracker, plus a markdown-list-continuation bug across the
   slot boundary that prettier's reflow exposed.
4. **Current state**: one file, tracker-agnostic prose throughout, with a
   single small "Tracker specifics" table (5 rows) as the only place a
   tracker is named. Adding a tracker is one new column.

Shape 4 is a real improvement, but landing on it took four iterations
without ever stepping back to ask whether the underlying idea — one
generic, hand-authored template meant to cover arbitrary future trackers —
is the right shape at all, or whether something else (e.g. tracker-specific
generation from a smaller number of primitives, or not generalizing past
GitHub/Linear until a third tracker is real) would serve better. That's the
discussion this handoff is for.

## Open questions worth discussing (not yet resolved, not just "do X")

- **Is the Tracker specifics table's 5-row shape actually general?** It was
  reverse-engineered from GitHub + Linear's actual differences. Nothing has
  validated it against a third tracker (GitLab, Jira, a local-markdown
  tracker) — `SKILL.md` step 5 just says "ask the user, follow the closer
  pattern," untested.
- **Premature abstraction risk**: `setup-chiptus-env` was built to be
  reusable across repos before a second real repo has used it. Worth asking
  whether some of this (the external-docs relocation feature especially —
  see below) is speculative generality for a use case (Portainer) that
  hasn't actually run this skill yet.
- **External docs relocation** (`external-docs.md`, split out this session):
  an env var (`AGENTS_DOCS_REPO`) pointing at a separate git repo, or a
  `.git/agents-docs-path` local file, as the two pointer mechanisms. Neither
  has been exercised end-to-end. Whether a cloud Routine can actually clone
  a second repo mid-firing (permissions, the connector model) was flagged
  as a gap, not verified.
- **`npx skills` as the auto-install mechanism** (`SKILL.md` step 1): this
  session never actually ran `npx skills` to confirm the command surface —
  it was written defensively ("check `usage`/`--help` first, don't guess
  flags") specifically _because_ it wasn't verified. Worth confirming for
  real before relying on it.
- **The `triage/` label-name prefix for GitHub** (added late, reactively,
  from the user noticing Linear's grouped labels display like
  `triage/ready-for-agent` in its UI): this is a real, checked fact for
  Linear (its labels have plain names; the display grouping comes from the
  `parent` field — confirmed via `linearis`) but the GitHub-side
  recommendation is a stylistic suggestion, not validated against how
  GitHub actually renders labels, and `setup-matt-pocock-skills`'s own
  `triage-labels.md` seed template (which `setup-chiptus-env` doesn't own)
  wasn't updated to reflect it — the suggestion currently only lives as a
  verbal aside in `setup-chiptus-env`'s step 2.
- **Should `setup-chiptus-env` exist as a separate skill at all**, chained
  in front of `setup-matt-pocock-skills`, versus proposing changes upstream
  to `setup-matt-pocock-skills` itself (which is `npx skills`-managed and
  gets overwritten on reinstall — a real tension: `setup-chiptus-env`
  currently patches around that skill's limits rather than fixing them at
  the source).

## What's already landed and shouldn't be re-litigated without reason

- The Linear-side triage-label group (live in Linear, team `UPL`) and the
  `agent` + native-status lifecycle scheme (also live) — these are done,
  working, and unrelated to the `setup-chiptus-env` skill's own design
  questions above.
- `docs/git-conventions.md`, `docs/agents/triage-labels.md`,
  `docs/agents/autonomic-issues.md`, `docs/agents/issue-tracker.md` (all
  UpLine's own, already-instantiated docs, not templates) are settled and
  merged in spirit even if PR #498 hasn't merged yet.
- The `pr-review-fixer` skill's `gh`-CLI-missing fallback (now uses
  `mcp__github__*` tools) — a genuine bug fix, not a design question.

## Suggested skills for the next session

- **`grilling`** — load this first. The rapid iteration pattern above (four
  reactive redesigns in one session, several "we agreed X" moments recalled
  from earlier in a long conversation rather than re-derived) is exactly
  the situation this skill exists for: stress-test the current design
  against its actual constraints before writing more of it.
- **`writing-for-agents`** — already used once this session for a pass over
  `setup-chiptus-env`; the open questions above go deeper than wording and
  need the design settled first, but re-check the skill once decisions land.
- **`domain-modeling`** — if the discussion produces settled vocabulary
  (e.g. what "claimed"/"in review" mean generically, what a "tracker
  specifics table" actually is as a concept), worth capturing in a
  `CONTEXT.md`/ADR so it doesn't need re-deriving next time.

## Where things are

- Branch: `docs/triage-labels-git-conventions`
- PR: https://github.com/chiptus/UpLine/pull/498 (open, not merged)
- Skill under discussion: `.claude/skills/setup-chiptus-env/` (`SKILL.md`,
  `autonomic-issues.md`, `external-docs.md`)
