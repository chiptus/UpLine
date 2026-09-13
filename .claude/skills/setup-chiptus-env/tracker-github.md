<!-- Fragment for autonomic-issues.md's GitHub variant. Five sections below,
     each headed by the slot name it fills — copy each section's body
     (everything between its heading and the next) into that slot. -->

## {{INTRO}}

Two Claude Code Routines work this repo's GitHub issue backlog (`<owner/repo>`) so the maintainer only reviews: a `<CADENCE>` **triage sweep** labels incoming issues, and a `<CADENCE>` **fix worker** (~1h later, on `<FIX_MODEL>`) turns one `ready-for-agent` issue into a green, tested, self-reviewed PR. Each firing is a fresh cloud session with no memory — all cross-firing state lives in GitHub issue labels, issue comments, and PRs. Label vocabulary: `docs/agents/triage-labels.md`; tracker operations: `docs/agents/issue-tracker.md`; branch naming: `docs/git-conventions.md` if this repo has one.

## {{SHARED_STATE}}

## Shared state: the `agent:` labels

In-flight state lives as labels **on GitHub issues**; an issue's label tells any fresh firing where it is in the pipeline. `agent:wip` / `agent:pr` / `epic` are lifecycle markers, alongside whichever triage-role label the issue also carries. The PR body carries `Closes #<n>` so GitHub closes the linked issue when the PR merges — that happens outside the routine (merging is the maintainer's), so don't treat it as something the fix firing itself performs.

**The PR cap**: at run start the fix worker counts open issues labeled `agent:pr`: `gh issue list --state open --label agent:pr --json number`. At or above **`<PR_CAP>`**, the review queue is full — end silently.

**Coexistence with manual sessions**: agents skip any issue with an assignee or with an open linked PR (`gh issue view <n> --json assignees,timelineItems` or a linked-PR search).

**Stale claims**: the triage sweep releases any `agent:wip` older than ~24h (by the claim comment's timestamp) with no open linked PR: remove the label and leave a "stale claim released" comment.

## {{INTAKE_QUERY}}

(`gh issue list --state open --json number,title,body,labels`).

## {{FIX_FIRING_STEPS}}

1. **Repair before build**: list issues labeled `agent:pr` (`gh issue list --state open --label agent:pr`) and follow each to its open linked PR. If any such PR is conflicted with main or CI-red on its current head, restoring it **is** this firing's work — then end. PRs the maintainer has left review comments on are his: leave them untouched.
2. **Cap check**: same count as above; at or above `<PR_CAP>` → end silently.
3. **Pick one issue**: `ready-for-agent` issues, skipping any with an assignee or an open linked PR, ordered by `<PRIORITY_SIGNAL>` (a `priority:*` label if this repo uses one, else oldest first: `gh issue list --state open --label ready-for-agent --json number,createdAt,labels`). None eligible → end silently.
4. **Claim**: `gh issue edit <n> --add-label agent:wip` and post a claim comment (timestamp + branch name) before any work.
5. **Implement via the implement skill**: read `.claude/skills/implement/SKILL.md` directly and follow it, with the issue as the spec. Its steps run inside the quality gates below.
6. **Open the PR** following `.claude/skills/create-pr/SKILL.md` exactly, with `Closes #<n>` in the PR body. Swap the issue's `agent:wip` to `agent:pr`; label the PR itself `agent:pr`. One PR per firing.

**Mid-run bail**: the picked issue turns out not agent-ready → re-route it with a comment on what you found, remove `agent:wip`, pick the next eligible issue.

**Failed run**: can't reach green/tested → comment what was tried, push the branch for salvage (no PR), remove `agent:wip`, flip `ready-for-agent` to `ready-for-human`.

## {{SETUP_ITEMS}}

1. Create the pipeline labels (`agent:wip`, `agent:pr`, `epic`) plus the five canonical triage-role labels in **GitHub** (`<owner/repo>`), if not already present from `setup-matt-pocock-skills`. If this repo wants a priority signal, create `priority:high` / `priority:low` labels — GitHub issues have no native priority field.
2. Create the **triage** Routine: `<CADENCE>`, `<TRIAGE_MODEL>`, this repo only, connectors for GitHub, push notifications on, the triage prompt below.
