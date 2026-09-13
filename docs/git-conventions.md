# Git Conventions

Single source of truth for branch naming and commit/PR title format. Referenced from `CLAUDE.md` and `docs/agents/autonomic-issues.md` instead of restated there.

## Type

Shared across branch names and commit/PR titles below: one of `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `ci`, `chore`, `revert`.

## Branch naming

`<type>/<description-slug>` — e.g. `fix/consolidate-set-types`.

The autonomic pipeline's issue-linked variant ties a branch to its Linear issue: `<type>-<id>/<slug>`, e.g. `fix-448/consolidate-set-types`, where `<id>` is the numeric part of the Linear identifier (`UPL-448` → `448`).

## Commit message / PR title format

This repo has no commitlint config — `.claude/skills/create-pr/SKILL.md` is the enforced convention for PR titles, and commit messages should follow the same shape:

`<type>(<scope>): <subject>`

- **Scope**: the module/feature affected (e.g. `groups`, `voting`, `auth`, `filters`, `components`).
- **Subject**: lowercase, imperative mood, no period.

See `.claude/skills/create-pr/SKILL.md` for the full PR title/description/verification rules.
