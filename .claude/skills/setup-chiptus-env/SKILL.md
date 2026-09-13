---
name: setup-chiptus-env
description: "Configure this repo end to end: install setup-matt-pocock-skills if missing (via npx skills), run it for the issue tracker / triage labels / domain docs, optionally point domain docs at an external folder, then scaffold the autonomic issue pipeline (triage sweep + fix worker Routines) wired to whichever tracker was chosen. Run once per repo before relying on the autonomic pipeline."
disable-model-invocation: true
---

# Setup Chiptus Env

In order: install `setup-matt-pocock-skills` if this repo doesn't have it yet, run it to pick this repo's issue tracker (and the triage labels, domain docs it also configures), offer to redirect those domain docs to an external folder for repos that can't keep them in-repo, then scaffold the autonomic issue pipeline — `docs/agents/autonomic-issues.md` — templated to that same tracker. The pipeline step reuses the tracker choice `setup-matt-pocock-skills` already made; never ask which tracker twice.

## Process

### 1. Ensure setup-matt-pocock-skills is installed

Check for a `setup-matt-pocock-skills` folder under `.claude/skills/` or `.agents/skills/`. Missing → install the mattpocock/skills set first: run `npx skills usage` (or `--help`) to confirm the current install command rather than guessing flags, then run it. Re-check the folder exists before continuing; if it still doesn't, tell the user the install failed and stop.

### 2. Run setup-matt-pocock-skills

Invoke the `setup-matt-pocock-skills` skill and let it run to completion (issue tracker, triage labels, domain docs, its own `## Agent skills` block). Its Section A answer is the tracker this skill scaffolds the pipeline for — read it back from `docs/agents/issue-tracker.md` (its heading names the tracker: GitHub, GitLab, Local, or the freeform "other" description) rather than asking again.

### 3. Offer an external domain-docs location

Ask one question: should domain docs (`CONTEXT.md`, `docs/adr/`) live in this repo — the mattpocock default step 2 just wrote — or in a separate folder outside it? Default **in-repo**; skip asking only if the repo already has an obvious signal it needs the external form (e.g. a public repo for a product whose architecture/customer docs must stay out of it, as with Portainer).

On **external**, get the folder's path (absolute, outside this repo's working tree — a private docs repo or local folder the user names) and rewrite `docs/agents/domain.md` in place: same rules (glossary vocabulary, ADR-conflict flagging), but pointing at that external path instead of the in-repo `CONTEXT.md` / `docs/adr/`. Note in the file that this deviates from the mattpocock default, so re-running `setup-matt-pocock-skills` alone (outside this skill) would overwrite it back to in-repo — that's an explicit tradeoff, not a bug to fix.

### 4. Check prerequisites

The autonomic pipeline needs the `triage` skill (fires the rubric) and an `implement` skill or equivalent (does the fix-firing work) already installed — step 1's `npx skills` install covers both if it ran. If either is still missing, tell the user which is missing and stop — nothing to scaffold without them.

### 5. Pick the pipeline template

- Tracker is **GitHub** → [`autonomic-issues-github.md`](./autonomic-issues-github.md).
- Tracker is **Linear** → [`autonomic-issues-linear.md`](./autonomic-issues-linear.md).
- Tracker is **GitLab, Local, or other** → no ready template. Ask the user whether the pipeline should follow the GitHub-shaped commands or the Linear-shaped commands (whichever is the closer fit — a CLI issuing list/create/label/comment calls vs. a CLI issuing the same over a team-scoped tracker), then adapt that template's commands to the actual tracker CLI.

### 6. Fill and confirm

Fill the chosen template's placeholders (repo/team identifiers, PR cap, routine cadence and models) from what step 2 already learned plus one round of questions for anything it didn't — routine cadence, PR-cap number, which models to run triage vs. fix on. Show the filled draft before writing; let the user edit it.

### 7. Write

- Write the filled draft to `docs/agents/autonomic-issues.md`.
- Add (or update in place, if already present) an `### Autonomic issue pipeline` entry under the `## Agent skills` block in whichever of `CLAUDE.md` / `AGENTS.md` step 2 edited:

  ```markdown
  ### Autonomic issue pipeline

  [one-line summary: cadence + what it produces]. See `docs/agents/autonomic-issues.md`.
  ```

### 8. Done

Tell the user the doc is written, and that turning it on still needs the one-time manual setup checklist inside `docs/agents/autonomic-issues.md` (creating labels, creating the two Routines) — this skill writes the playbook, not the Routines themselves.
