# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## When `gh` isn't available (Claude Code on the web / remote sessions)

In remote execution environments the `gh` CLI is often absent and GitHub is reached through the GitHub MCP tools (`mcp__github__*`) instead. Use these equivalents; the `gh` commands above remain the canonical reference for what each operation should do.

| Operation                | `gh` command                | GitHub MCP tool                                            |
| ------------------------ | --------------------------- | --------------------------------------------------------- |
| Create an issue          | `gh issue create`           | `issue_write` (method `create`)                           |
| Read an issue + comments | `gh issue view --comments`  | `issue_read`                                              |
| List issues              | `gh issue list`             | `list_issues` / `search_issues`                           |
| Comment on an issue      | `gh issue comment`          | `add_issue_comment`                                       |
| Apply / remove labels    | `gh issue edit --add-label` | `issue_write` (method `update`, with `labels`)            |
| Close an issue           | `gh issue close`            | `issue_write` (method `update`, `state: closed`)          |
| Read a PR + comments     | `gh pr view --comments`     | `pull_request_read`                                       |
| Read a PR diff           | `gh pr diff`                | `pull_request_read` (diff)                                |
| List external PRs        | `gh pr list`                | `list_pull_requests` / `search_pull_requests`             |

The repo is `chiptus/UpLine` — pass it as the `owner`/`repo` arguments the MCP tools require (they don't infer it from the clone the way `gh` does). Schemas load on demand via ToolSearch.

## Pull requests as a triage surface

**PRs as a request surface: yes.** _(Set to `no` if this repo stops treating external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
