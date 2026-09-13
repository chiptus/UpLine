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

### 3. Offer an external docs location

Ask one question: should this repo's agent docs — `docs/agents/` (issue tracker, triage labels, autonomic pipeline, domain consumer rules) and, if used, `CONTEXT.md` / `docs/adr/` — live in this repo, or in a separate folder outside it? Default **in-repo**; skip asking only if the repo already has an obvious signal it needs the external form (e.g. a public repo for a product whose architecture/customer docs must stay out of it, as with Portainer).

On **external**, move the whole thing as one unit rather than picking files apart: the external root mirrors the in-repo layout exactly (`<external-root>/docs/agents/*.md`, and `<external-root>/CONTEXT.md` / `docs/adr/` if those are included). Every cross-reference the docs make to each other (`docs/agents/triage-labels.md` from inside `autonomic-issues.md`, etc.) stays a repo-root-relative path unchanged — only the root moves, so nothing inside these docs needs rewriting.

**Pointer mechanism**: an environment variable — e.g. `AGENTS_DOCS_REPO` — holding the git remote URL of a separate repo that holds the external root. This is the default, because it's the one mechanism that reaches both a local session and a cloud Routine firing: set it in this local shell's `.envrc`/profile _and_ in the Routine's own `environment_variables` when creating it (step 2 of the pipeline setup checklist the templates generate). When the var is set, clone or fetch it (a shallow clone to a scratch path is enough for a read) instead of reading `docs/agents/` in-repo.

A file under `.git/` (the Portainer pattern — e.g. `.git/agents-docs-path`, holding a plain local folder path, not a repo URL) is a lighter option when there's no cloud Routine ever going to need the docs — a solo local setup only. It's simpler for that one case, but it inherits the same gap the env var exists to avoid: a Routine firing off a fresh clone has no access to anything recorded in _this_ machine's `.git/`. Ask the user which fits (a separate docs repo they're willing to maintain and grant Routine access to, vs. a local-only folder) rather than defaulting silently — the choice determines whether the autonomic pipeline can read these docs at all.

The only places that need to _resolve_ whichever pointer is chosen, rather than just cross-reference within the moved folder, are the ones read before you're inside `docs/agents/` at all: `CLAUDE.md`/`AGENTS.md`'s `## Agent skills` block, and the two Routine prompts (step 7). Phrase each of those as: "See `docs/agents/issue-tracker.md` — or, if `$AGENTS_DOCS_REPO` (or `.git/agents-docs-path`) is set, that location's `docs/agents/issue-tracker.md`." Everything else — the docs' own mutual cross-references — needs no change, per the paragraph above.

### 4. Check prerequisites

The autonomic pipeline needs the `triage` skill (fires the rubric) and an `implement` skill or equivalent (does the fix-firing work) already installed — step 1's `npx skills` install covers both if it ran. If either is still missing, tell the user which is missing and stop — nothing to scaffold without them.

### 5. Pick the pipeline template

- Tracker is **GitHub** → [`autonomic-issues-github.md`](./autonomic-issues-github.md).
- Tracker is **Linear** → [`autonomic-issues-linear.md`](./autonomic-issues-linear.md).
- Tracker is **GitLab, Local, or other** → no ready template. Ask the user whether the pipeline should follow the GitHub-shaped commands or the Linear-shaped commands (whichever is the closer fit — a CLI issuing list/create/label/comment calls vs. a CLI issuing the same over a team-scoped tracker), then adapt that template's commands to the actual tracker CLI.

### 6. Fill and confirm

Fill the chosen template's placeholders (repo/team identifiers, PR cap, routine cadence and models) from what step 2 already learned plus one round of questions for anything it didn't — routine cadence, PR-cap number, which models to run triage vs. fix on. Show the filled draft before writing; let the user edit it.

### 7. Write

- Write the filled draft to `docs/agents/autonomic-issues.md` (or, if step 3 relocated docs, to the external root's mirrored path).
- Add (or update in place, if already present) an `### Autonomic issue pipeline` entry under the `## Agent skills` block in whichever of `CLAUDE.md` / `AGENTS.md` step 2 edited, using step 3's pointer-resolution phrasing if docs were relocated:

  ```markdown
  ### Autonomic issue pipeline

  [one-line summary: cadence + what it produces]. See `docs/agents/autonomic-issues.md`.
  ```

### 8. Done

Tell the user the doc is written, and that turning it on still needs the one-time manual setup checklist inside `docs/agents/autonomic-issues.md` (creating labels, creating the two Routines) — this skill writes the playbook, not the Routines themselves.
