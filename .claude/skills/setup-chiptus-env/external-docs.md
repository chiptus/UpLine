# Relocating docs/agents/ externally

Reached from `SKILL.md` step 3 only when the answer to "in-repo or external?" is
external — everything here is reference for that one branch, not read on the
common in-repo path.

## Layout

Move the whole thing as one unit rather than picking files apart: the external root
mirrors the in-repo layout exactly (`<external-root>/docs/agents/*.md`, and
`<external-root>/CONTEXT.md` / `docs/adr/` if those are included). Every cross-reference
the docs make to each other (`docs/agents/triage-labels.md` from inside
`autonomic-issues.md`, etc.) stays a repo-root-relative path unchanged — only the root
moves, so nothing inside these docs needs rewriting.

## Pointer mechanism

The only mechanism: an environment variable — `AGENTS_DOCS_REPO` — holding the git remote
URL of a separate repo that holds the external root. This is the one mechanism that
reaches both a local session and a cloud Routine firing: set it in this local shell's
`.envrc`/profile _and_ in the Routine's own `environment_variables` when creating it
(setup checklist item 2 in the filled `autonomic-issues.md`). When the var is set, clone
or fetch it (a shallow clone to a scratch path is enough for a read) instead of reading
`docs/agents/` in-repo.

There is deliberately no local-file-only alternative (e.g. a path recorded under `.git/`)
even for a solo setup with no cloud Routine yet — that shape only works for a session on
this one machine, and a Routine firing off a fresh clone would have no way to read it. If
external docs are needed at all, they need to be reachable from a fresh clone, which means
a separate repo behind `AGENTS_DOCS_REPO` from the start.

## Wiring it in

Leave `CLAUDE.md`/`AGENTS.md`'s `## Agent skills` block plain — "See
`docs/agents/issue-tracker.md`", no conditional phrasing — since it's always read
locally regardless of where the docs actually live, and rewriting every pointer sentence
there would duplicate the same resolution logic at every call site. The resolution has
exactly one place it belongs: whichever skill goes and reads `CONTEXT.md` /
`docs/adr/` / `docs/agents/*` directly, since that's the code path that actually needs
to know.

Find those skills with `grep -rl "CONTEXT.md\|docs/adr\|docs/agents" .agents/skills/`
(don't hardcode a list — it drifts as skills change) and prepend one identical line to
each, near wherever it currently says to read the file: "Check `$AGENTS_DOCS_REPO` first;
if set, read this file from there instead of the in-repo path." Also add the same line to
the two Routine prompts in the filled
`autonomic-issues.md`, since a Routine firing reads it the same way.

These target files are `npx skills`-managed (mattpocock/skills) — flag this deviation to
the user the same way as any other edit to a managed file: a future bare `npx skills`
reinstall (outside this skill) would overwrite the added line back out.
