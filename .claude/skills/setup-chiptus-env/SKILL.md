---
name: setup-chiptus-env
description: "Configure this repo end to end: run setup-matt-pocock-skills for the issue tracker / triage labels / domain docs, then scaffold the autonomic issue pipeline (triage sweep + fix worker Routines) wired to whichever tracker was chosen. Run once per repo before relying on the autonomic pipeline."
disable-model-invocation: true
---

# Setup Chiptus Env

Two things, in order: run `setup-matt-pocock-skills` to pick this repo's issue tracker (and the triage labels, domain docs it also configures), then scaffold the autonomic issue pipeline — `docs/agents/autonomic-issues.md` — templated to that same tracker. The second step reuses the tracker choice the first step already made; never ask which tracker twice.

## Process

### 1. Run setup-matt-pocock-skills

Invoke the `setup-matt-pocock-skills` skill and let it run to completion (issue tracker, triage labels, domain docs, its own `## Agent skills` block). Its Section A answer is the tracker this skill scaffolds the pipeline for — read it back from `docs/agents/issue-tracker.md` (its heading names the tracker: GitHub, GitLab, Local, or the freeform "other" description) rather than asking again.

### 2. Check prerequisites

The autonomic pipeline needs the `triage` skill (fires the rubric) and an `implement` skill or equivalent (does the fix-firing work) already installed. If either is missing, tell the user which is missing and stop — nothing to scaffold without them.

### 3. Pick the pipeline template

- Tracker is **GitHub** → [`autonomic-issues-github.md`](./autonomic-issues-github.md).
- Tracker is **Linear** → [`autonomic-issues-linear.md`](./autonomic-issues-linear.md).
- Tracker is **GitLab, Local, or other** → no ready template. Ask the user whether the pipeline should follow the GitHub-shaped commands or the Linear-shaped commands (whichever is the closer fit — a CLI issuing list/create/label/comment calls vs. a CLI issuing the same over a team-scoped tracker), then adapt that template's commands to the actual tracker CLI.

### 4. Fill and confirm

Fill the chosen template's placeholders (repo/team identifiers, PR cap, routine cadence and models) from what step 1 already learned plus one round of questions for anything it didn't — routine cadence, PR-cap number, which models to run triage vs. fix on. Show the filled draft before writing; let the user edit it.

### 5. Write

- Write the filled draft to `docs/agents/autonomic-issues.md`.
- Add (or update in place, if already present) an `### Autonomic issue pipeline` entry under the `## Agent skills` block in whichever of `CLAUDE.md` / `AGENTS.md` step 1 edited:

  ```markdown
  ### Autonomic issue pipeline

  [one-line summary: cadence + what it produces]. See `docs/agents/autonomic-issues.md`.
  ```

### 6. Done

Tell the user the doc is written, and that turning it on still needs the one-time manual setup checklist inside `docs/agents/autonomic-issues.md` (creating labels, creating the two Routines) — this skill writes the playbook, not the Routines themselves.
