---
name: setup-chiptus-env
description: "Configure this repo end to end: install setup-matt-pocock-skills if missing (via npx skills), run it for the issue tracker / triage labels / domain docs, optionally relocate docs/agents/ (and domain docs) to a separate docs repo pointed to by an env var — reachable from both local sessions and cloud Routines — then scaffold the autonomic issue pipeline (triage sweep + fix worker Routines) wired to whichever tracker was chosen. Run once per repo before relying on the autonomic pipeline."
disable-model-invocation: true
---

# Setup Chiptus Env

In order: install `setup-matt-pocock-skills` if this repo doesn't have it yet, run it to pick this repo's issue tracker (and the triage labels, domain docs it also configures), offer to relocate `docs/agents/` (and domain docs) to an external folder for repos that can't keep them in-repo, then scaffold the autonomic issue pipeline — `docs/agents/autonomic-issues.md` — templated to that same tracker. The pipeline step reuses the tracker choice `setup-matt-pocock-skills` already made; never ask which tracker twice.

## Process

### 1. Ensure setup-matt-pocock-skills is installed

Check for a `setup-matt-pocock-skills` folder under `.claude/skills/` or `.agents/skills/`. Missing → install it with `npx skills add <setup-matt-pocock-skills package> -s "*" -a claude-code -y --json` (verified flag shape — the agent identifier is `claude-code`, not `claude`; the latter is rejected by the CLI). Safe to re-run if already installed (idempotent; re-reports "installed" rather than erroring). Re-check the folder exists before continuing; if it still doesn't, tell the user the install failed and stop.

### 2. Run setup-matt-pocock-skills

Invoke the `setup-matt-pocock-skills` skill and let it run to completion (issue tracker, triage labels, domain docs, its own `## Agent skills` block). Its Section A answer is the tracker this skill scaffolds the pipeline for — read it back from `docs/agents/issue-tracker.md` (its heading names the tracker: GitHub, GitLab, Local, or the freeform "other" description) rather than asking again.

If Section B (triage labels) is running and the tracker is GitHub, suggest naming the five labels with a `triage/` prefix (`triage/needs-triage`, `triage/ready-for-agent`, …) when it asks whether to keep the defaults — this repo's convention is `/` as the delimiter for every prefixed label, matching `priority/*`, `agent/*`, etc. (see `references/github.md`). This is a plain naming choice for consistency, not a GitHub grouping feature — GitHub renders `/` no differently than any other character. Still the user's call; don't override a "keep defaults" answer.

### 3. Offer an external docs location

Ask one question: should this repo's agent docs — `docs/agents/` (issue tracker, triage labels, autonomic pipeline, domain consumer rules) and, if used, `CONTEXT.md` / `docs/adr/` — live in this repo, or in a separate folder outside it? Default **in-repo**; skip asking only if the repo already has an obvious signal it needs the external form (e.g. a public repo for a product whose architecture/customer docs must stay out of it, as with Portainer).

On **external**, read [`external-docs.md`](./external-docs.md) for the layout, the `AGENTS_DOCS_REPO` pointer mechanism, and how to wire the consumer skills — don't reach for any of that from first principles.

### 4. Check prerequisites

The autonomic pipeline needs the `triage` skill (fires the rubric) and an `implement` skill or equivalent (does the fix-firing work) already installed — step 1's `npx skills` install covers both if it ran. If either is still missing, tell the user which is missing and stop — nothing to scaffold without them.

### 5. Point at the right tracker reference file

[`autonomic-issues.md`](./autonomic-issues.md) is tracker-agnostic throughout; tracker-dependent content (how "claimed"/"in review" are represented, how priority works, how a PR declares its issue link) lives in [`references/github.md`](./references/github.md) or [`references/linear.md`](./references/linear.md), one file per tracker.

- Tracker is **GitHub** or **Linear** → both reference files are already written; nothing to fill in for this step.
- Tracker is **GitLab, Local, or other** → no reference file yet. Ask the user whether it's closer to GitHub's shape (flat labels, no native per-issue status) or Linear's (a native status field to piggyback on), then write `references/<tracker>.md` following that closer file's structure — don't edit the existing GitHub/Linear files to accommodate it.

### 6. Fill and confirm

Replace every `<TRACKER>` / `<TEAM>` / `<owner/repo>` placeholder with this repo's actual values from what step 2 already learned, plus one round of questions for anything it didn't — routine cadence, PR-cap number, which models to run triage vs. fix on. Show the filled draft before writing; let the user edit it.

### 7. Write

- Write the filled draft to `docs/agents/autonomic-issues.md`, plus `docs/agents/references/github.md` and/or `docs/agents/references/linear.md` (only the file(s) for the tracker(s) actually in use) — or, if step 3 relocated docs, to the external root's mirrored paths.
- Add (or update in place, if already present) an `### Autonomic issue pipeline` entry under the `## Agent skills` block in whichever of `CLAUDE.md` / `AGENTS.md` step 2 edited — plain, no conditional phrasing, per step 3:

  ```markdown
  ### Autonomic issue pipeline

  [one-line summary: cadence + what it produces]. See `docs/agents/autonomic-issues.md`.
  ```

### 8. Done

Tell the user the doc is written, and that turning it on still needs the one-time manual setup checklist inside `docs/agents/autonomic-issues.md` (creating labels, creating the two Routines) — this skill writes the playbook, not the Routines themselves.
