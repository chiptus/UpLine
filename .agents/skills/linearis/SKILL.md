---
name: linearis
description: >-
  Manage Linear.app work from the command line with the linearis CLI (bins
  linearis / linear), which outputs JSON: issues/tickets, projects, cycles
  (sprints), milestones, initiatives (roadmap), documents, labels, teams,
  users, and issue discussions/comments. Use when the user mentions Linear, a
  ticket identifier like ENG-42 or ABC-123, sprints, triage, or the roadmap, or
  asks to create, read, search, update, assign, comment on, or otherwise manage
  Linear issues and projects.
license: MIT
compatibility: Requires Node >=22 and LINEAR_API_TOKEN in the environment. linearis itself is a project devDependency, run via `npx linearis` — no global install.
allowed-tools: Bash(npx linearis:*), Bash(npx linear:*), Bash(jq:*)
metadata:
  author: linearis-oss
  version: "1.0.0"
---

# linearis

Drive [Linear.app](https://linear.app) from the shell via `npx linearis` (JSON-only output; `npx linear` is an alias — both resolve this project's pinned devDependency, never a global install). Do not guess the command surface — the CLI documents itself, and this skill teaches the protocol, not the flags.

## Preflight (reactive — branch on the CLI's own output; don't pre-run checks every turn)

- **Not installed** — if `npx` offers to download linearis instead of resolving it instantly, the devDependency is missing from `node_modules`; run `pnpm install` and retry. Never accept npx's install prompt and never `npm install -g` — either bypasses the pinned version.
- **Auth required** — any command may fail with this envelope on stderr and exit code 42:
  `{ "error": "AUTHENTICATION_REQUIRED", "action": "USER_ACTION_REQUIRED", "instruction": "Run 'linearis auth login' …", "exit_code": 42 }`.
  Detect it by `exit_code === 42` / `error === "AUTHENTICATION_REQUIRED"` (not paraphrased text) and surface the CLI's own `instruction`. `linearis auth login` is an interactive browser flow you cannot complete — hand it to the user.
- **Invalid invocation** — an unknown command or option, a wrong argument count, or a command group named without a subcommand fails on stderr with exit code `2`:
  `{ "error": "UNKNOWN_COMMAND", "message": "…", "suggestion": "Did you mean read?", "command": "linearis issues", "available_commands": [...], "instruction": "Run 'linearis issues usage' …", "exit_code": 2 }`.
  Recover from the envelope, not by guessing: pick from `available_commands`, or run the `instruction`. `error` is one of `UNKNOWN_COMMAND`, `UNKNOWN_OPTION`, `MISSING_ARGUMENT`, `MISSING_REQUIRED_OPTION`, `MISSING_OPTION_ARGUMENT`, `TOO_MANY_ARGUMENTS`, `MISSING_SUBCOMMAND`, `INVALID_USAGE`. A bare group (`linearis issues`) is a failure, not a request for help.
- **Updates** — this project pins the version in `package.json`; bump it there (and run `pnpm install`) rather than updating linearis directly.

## Discover, then act

1. Run `npx linearis usage` once for the list of domains (issues, projects, cycles, …).
2. Run `npx linearis <domain> usage` for a domain's full command and flag reference **before** acting.
3. Never invent flags or subcommands — `usage` is authoritative and always current.

## Output

Every command prints JSON on stdout. Shape it at the source with the global `--fields identifier,title,state.name` and `--compact` — no external binary, works on Windows and fresh containers. Reach for `jq` only for complex reshaping, and fall back to raw JSON if `jq` is absent.

## Invariants worth knowing (everything else lives in `usage`)

- IDs are forgiving: pass a UUID, team key (`ENG`), issue identifier (`ABC-123`), or name interchangeably. Reference tickets by identifier.
- `issues create` requires `--team`; some filters need a scope flag — confirm in `usage` rather than memorizing.
- Threaded discussion lives under `issues discuss` / `discussions` / `replies` / `reply`. The top-level `comments` domain is a deprecated facade (still works) — prefer the `issues` discussion commands. Record non-trivial progress in a discussion thread and keep the description in sync on status changes.
- `files download <url>` only fetches Linear storage URLs (`uploads.linear.app`); `files upload` returns an `assetUrl` you can embed; `issues read --with-attachments` lists linked resources (PRs, docs, URLs) — references, not necessarily downloadable files.

For anything not covered here, `npx linearis <domain> usage` is the reference.
