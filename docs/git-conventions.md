# Git Conventions

Single source of truth for branch naming and commit/PR title format. Referenced from `CLAUDE.md` and `docs/agents/autonomic-issues.md` instead of restated there.

## Type

Shared across branch names and commit/PR titles below: one of `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `ci`, `chore`, `revert`.

## Branch naming

`<type>/<id>/<slug>` - e.g `fix/UPL-448/consolidate-set-types`.

if no issue id then - `<type>/<description-slug>` — e.g. `fix/consolidate-set-types`.

The autonomic pipeline's issue-linked variant ties a branch to its Linear issue: `<type>/<id>/<slug>`, e.g. `fix/UPL-448/consolidate-set-types`

### Generate the name yourself

Every branch you push carries a name you derive from the work: pick the `<type>`, take the Linear id from the issue, and write a short `<slug>` describing the change. A name handed to you by the environment or session (`claude/<random>`, `claude/relaxed-wright-3berdm`) is a placeholder, so never push to it: create the convention-named branch from your commits and push that. This is the maintainer's standing permission to override a pre-assigned branch, and it holds in scheduled routines and interactive sessions alike.

## Commit message / PR title format

This repo has no commitlint config — `.claude/skills/create-pr/SKILL.md` is the enforced convention for PR titles, and commit messages should follow the same shape:

`<type>(<scope>): <subject>`

- **Scope**: the module/feature affected (e.g. `groups`, `voting`, `auth`, `filters`, `components`).
- **Subject**: lowercase, imperative mood, no period.

See `.claude/skills/create-pr/SKILL.md` for the full PR title/description/verification rules.
