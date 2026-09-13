---
name: setup-chiptus-env
description: "Configure this repo end to end: install setup-matt-pocock-skills if missing (via npx skills), run it for the issue tracker / triage labels / domain docs, optionally relocate docs/agents/ (and domain docs) to a separate docs repo pointed to by an env var — reachable from both local sessions and cloud Routines — then scaffold the autonomic issue pipeline (triage sweep + fix worker Routines) wired to whichever tracker was chosen. Run once per repo before relying on the autonomic pipeline."
disable-model-invocation: true
---

# Setup Chiptus Env

In order: install `setup-matt-pocock-skills` if this repo doesn't have it yet, run it to pick this repo's issue tracker (and the triage labels, domain docs it also configures), offer to relocate `docs/agents/` (and domain docs) to an external folder for repos that can't keep them in-repo, then scaffold the autonomic issue pipeline — `docs/agents/autonomic-issues.md` — templated to that same tracker. The pipeline step reuses the tracker choice `setup-matt-pocock-skills` already made; never ask which tracker twice.

## Process

### 1. Ensure setup-matt-pocock-skills is installed

Check for a `setup-matt-pocock-skills` folder under `.claude/skills/` or `.agents/skills/`. Missing → install the mattpocock/skills set first: run `npx skills usage` (or `--help`) to confirm the current install command rather than guessing flags, then run it. Re-check the folder exists before continuing; if it still doesn't, tell the user the install failed and stop.

### 2. Run setup-matt-pocock-skills

Invoke the `setup-matt-pocock-skills` skill and let it run to completion (issue tracker, triage labels, domain docs, its own `## Agent skills` block). Its Section A answer is the tracker this skill scaffolds the pipeline for — read it back from `docs/agents/issue-tracker.md` (its heading names the tracker: GitHub, GitLab, Local, or the freeform "other" description) rather than asking again.

If Section B (triage labels) is running and the tracker is GitHub, suggest naming the five labels with a `triage/` prefix (`triage/needs-triage`, `triage/ready-for-agent`, …) when it asks whether to keep the defaults — GitHub has no label-group feature to give them Linear's grouped look, so a shared prefix is the closest substitute. Still the user's call; don't override a "keep defaults" answer.

### 3. Offer an external docs location

Ask one question: should this repo's agent docs — `docs/agents/` (issue tracker, triage labels, autonomic pipeline, domain consumer rules) and, if used, `CONTEXT.md` / `docs/adr/` — live in this repo, or in a separate folder outside it? Default **in-repo**; skip asking only if the repo already has an obvious signal it needs the external form (e.g. a public repo for a product whose architecture/customer docs must stay out of it, as with Portainer).

On **external**, read [`external-docs.md`](./external-docs.md) for the layout, the pointer mechanism (and which of its two options to use), and how to wire the consumer skills — don't reach for any of that from first principles.

### 4. Check prerequisites

The autonomic pipeline needs the `triage` skill (fires the rubric) and an `implement` skill or equivalent (does the fix-firing work) already installed — step 1's `npx skills` install covers both if it ran. If either is still missing, tell the user which is missing and stop — nothing to scaffold without them.

### 5. Fill the Tracker specifics table

[`autonomic-issues.md`](./autonomic-issues.md) is one file, written tracker-agnostically throughout, with a single "Tracker specifics" table near the top holding the only tracker-dependent content: how "claimed"/"in review" are represented, how priority works, how a PR declares its issue link. Everything else refers back to that table by name rather than repeating mechanics — this is deliberately terse, not a place to re-explain a CLI the agent already knows from its own `usage`/`--help`.

- Tracker is **GitHub** or **Linear** → delete the other tracker's column from the table; both are already written.
- Tracker is **GitLab, Local, or other** → no ready column. Ask the user whether it's closer to GitHub's shape (flat labels, no native per-issue status) or Linear's (a native status field to piggyback on), then add a column for it following that closer pattern, and delete the column that isn't in use.

### 6. Fill and confirm

Replace every `<TRACKER>` / `<TEAM>` / `<owner/repo>` placeholder with this repo's actual values from what step 2 already learned, plus one round of questions for anything it didn't — routine cadence, PR-cap number, which models to run triage vs. fix on. Show the filled draft before writing; let the user edit it.

### 7. Write

- Write the filled draft to `docs/agents/autonomic-issues.md` (or, if step 3 relocated docs, to the external root's mirrored path).
- Add (or update in place, if already present) an `### Autonomic issue pipeline` entry under the `## Agent skills` block in whichever of `CLAUDE.md` / `AGENTS.md` step 2 edited — plain, no conditional phrasing, per step 3:

  ```markdown
  ### Autonomic issue pipeline

  [one-line summary: cadence + what it produces]. See `docs/agents/autonomic-issues.md`.
  ```

### 8. Done

Tell the user the doc is written, and that turning it on still needs the one-time manual setup checklist inside `docs/agents/autonomic-issues.md` (creating labels, creating the two Routines) — this skill writes the playbook, not the Routines themselves.
