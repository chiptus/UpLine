# Issue tracker: Linear

Issues for this repo live in Linear, team **UPL**. Use the `linearis` CLI (`npx linearis`, alias `npx linear`) for all operations — see `.claude/skills/linearis/SKILL.md` for auth, error handling, and the discovery protocol (`npx linearis usage`, then `npx linearis <domain> usage`). Don't guess flags; `usage` is authoritative.

## Conventions

- **Create an issue**: `npx linearis issues create --team UPL --title "..." --description "..."`. Use `usage` to confirm flags (e.g. labels, priority) before relying on them.
- **Read an issue**: `npx linearis issues read <identifier>` (e.g. `UPL-123`), with `--with-attachments` for linked PRs/docs/URLs.
- **List issues**: `npx linearis issues list --team UPL --fields identifier,title,state.name,labels` with state/label filters as needed — check `usage` for the exact filter flags.
- **Comment / discuss**: use the `issues discuss` / `discussions` / `replies` / `reply` commands (threaded discussion), not the deprecated top-level `comments` facade. Record non-trivial progress in a discussion thread and keep the description in sync on status changes.
- **Apply / remove labels**: via `issues update` (or the dedicated label flag `usage` documents).
- **Close / change state**: via `issues update --state ...` — Linear states are workflow states, not a boolean open/closed; confirm the state names for this team with `npx linearis` (team/workflow usage) rather than assuming GitHub-style "closed".

IDs are forgiving: pass a UUID, team key (`UPL`), issue identifier (`UPL-123`), or name interchangeably. Reference tickets by identifier in commits, PR bodies, and comments.

## Pull requests stay on GitHub

Code hosting and PRs remain in GitHub (`chiptus/UpLine`) — only issue tracking moved to Linear. Use `gh` for PR operations (create, view, diff, comment, merge). Link a PR to its Linear issue by including the issue identifier (e.g. `UPL-123`) in the PR title or body — Linear's GitHub integration picks this up automatically; don't rely on GitHub's own `Closes #N` syntax, which only works for GitHub issues.

## Pull requests as a triage surface

**PRs as a request surface: yes.** _(Set to `no` if this repo stops treating external PRs as feature requests; `/triage` reads this flag.)_

External PRs on GitHub are still a triage input even though issues live in Linear — triage a PR by reading it with `gh pr view <number> --comments` / `gh pr diff <number>`, then create or update the corresponding Linear issue (`npx linearis issues create` / `issues update`) rather than labeling the PR itself.

- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / close a PR**: `gh pr comment`, `gh pr close`.

## When a skill says "publish to the issue tracker"

Create a Linear issue: `npx linearis issues create --team UPL --title "..." --description "..."`.

## When a skill says "fetch the relevant ticket"

Run `npx linearis issues read <identifier>`.
