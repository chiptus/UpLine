# Routine mechanics for the autonomic pipeline

Research for issue #450 (wayfinder map #449). Investigated 2026-08-28 against primary sources:

- [code.claude.com/docs/en/routines](https://code.claude.com/docs/en/routines) ("Automate work with routines", research preview)
- [code.claude.com/docs/en/claude-code-on-the-web](https://code.claude.com/docs/en/claude-code-on-the-web)
- The live `claude-code-remote` MCP tool schemas available inside a Claude Code cloud session (`create_trigger`, `update_trigger`, `list_triggers`, `fire_trigger`, `send_later`) — these schemas are themselves first-party API surface and are cited below as "MCP schema".

Note: Routines are **in research preview** — "Behavior, limits, and the API surface may change" (routines doc). There are two overlapping surfaces: claude.ai **Routines** (web UI / `/schedule` in the CLI) and the in-session MCP **triggers** (`create_trigger` with `create_new_session_on_fire: true` = fresh-session-per-fire). They share the same trigger IDs (`trig_...`) and mechanics; some knobs (completion notifications) are only documented on the MCP surface.

## 1. Fresh-session-per-fire: repo, CLAUDE.md, skills, permissions

**How the session gets the repo.** Each run creates a brand-new cloud session. "Each repository is cloned at the start of a run, starting from the default branch. Claude creates `claude/`-prefixed branches for its changes" (routines doc). Multiple repositories can be attached. Pushes to non-`claude/` branches are checked and rejected if the branch is protected, has someone else's open PR, or carries commits authored by someone else.

**CLAUDE.md and skills.** Because the run is an ordinary Claude Code cloud session on a clone of the repo, everything committed to the repo loads as usual: "The session can run shell commands, use skills committed to the cloned repository, and call any connectors you include" (routines doc). Cloud sessions also pick up repo-committed agents automatically ("Subagents defined in your repo's `.claude/agents/` are picked up automatically" — web doc), and settings must be committed: "To change settings for a cloud session, use environment variables or commit settings files to the repository." So our `CLAUDE.md`, `.claude/skills/*`, and `.claude/settings.json` all apply to every firing — the repo is the configuration surface.

**GitHub / `gh` access.** Cloud sessions authenticate GitHub via the account's Claude GitHub App authorization or a `/web-setup`-synced `gh` token; "a cloud session can access any repository the connecting GitHub account can see" (web doc). Everything the routine does "appears as you: commits and pull requests carry your GitHub user" (routines doc).

**Permission mode.** There is no picker and no prompting: "Routines run autonomously as full Claude Code cloud sessions: there is no permission-mode picker and no approval prompts during a run" (routines doc). Safety is scoped structurally instead — by which repos you attach, the environment's network access level (Default env = **Trusted**, allowlist-only egress) and env vars, and which connectors you include ("Claude can use every tool from an included connector, including writes, without asking"). Corollary for the MCP path: never spawn an unattended child in `plan` mode — it "BLOCKS waiting for human approval ... and will stall indefinitely" (MCP schema, `create_session.permission_mode`).

**Trust framing of the prompt.** Since v2.1.213 the fired prompt is treated as the session's assigned task, not untrusted mid-conversation content — but "the fired prompt is not live user input and can't act as approval or consent for actions during the run" (routines doc).

## 2. Completion notifications and no-op silence

Documented on the MCP surface (`create_trigger.notifications`, MCP schema):

- "**push** sends to the owner's phone **when a run finishes with something noteworthy**; **email** sends the same summary to their inbox."
- Noteworthiness is judged per run — the schema's phrasing implies a quiet, nothing-to-report firing produces **no** push. This satisfies our "no-op firings stay silent" requirement, with the caveat that "noteworthy" is model/service-judged, not a boolean we control; the docs don't define it further.
- Notifications are **only** available for fresh-session-per-fire routines: "Completion notifications only apply to fresh-session-per-fire Routines (`create_new_session_on_fire=true`); the server rejects this parameter for self-bind or persistent_session_id Routines."
- Omitting the parameter leaves the server default; passing it is an explicit per-channel choice (`{push:true, email:true}`, `{email:true}` = email only, `{}` = all channels off).

Independent of notifications, every run lands as a session in the session list, and the run list shows status — but "a green status ... does not mean the task in your prompt succeeded. Open the run to read the transcript" (routines doc).

## 3. Model selection and cost bounding

**Per-routine model: yes.** "The prompt input includes a model selector. Claude uses the selected model on every run" (routines doc). On the MCP surface, `update_trigger.model` changes "the model used for this Routine's future fires", validated against the org's available models; "only fires that create a new session pick up the new model" (MCP schema). So a cheap triage sweep (e.g. Haiku/Sonnet) and an expensive fix routine (Opus/Fable) can be **separate routines with different models** — that is the supported cost lever.

**Cost bounding.** There is **no per-firing token or spend cap**. Bounds that do exist (routines doc, "Usage and limits"):

- Routines draw down subscription usage like interactive sessions; no separate compute charge for the VM.
- A **daily cap on runs started per account** (value shown at claude.ai/code/routines; not published as a fixed number). One-off runs don't count against it.
- Past the cap or the subscription limit: metered overage if usage credits are on, otherwise "additional runs are rejected until the window resets."

Practical bounding is therefore: model choice per routine + cadence + a prompt that ends the run early when there's nothing to do.

## 4. Cadence limits, reliability, overlap

- **Minimum interval: one hour.** "The minimum interval is one hour; expressions that run more frequently are rejected" (routines doc). The MCP schema agrees ("normally hourly; some projects allow shorter") and notes hourly schedules are anchored to the creation minute so routines spread across the hour. Daily is well within limits.
- **Stagger:** "Runs may start a few minutes after the scheduled time due to stagger. The offset is consistent for each routine."
- **Overlap: possible — no mutual exclusion documented.** Each firing "creates a new session alongside your other sessions"; for GitHub triggers the doc is explicit that "two PR updates produce two independent sessions." Nothing documents skipping a firing while a previous run is still going, and nothing serializes runs. **Consequence for the PR cap:** the cap must be enforced inside the prompt (e.g. "count open `claude/`-prefixed PRs first; if ≥ N, stop") and even then a race between overlapping firings can overshoot by one — a daily cadence with hour-scale runs makes this unlikely but the playbook shouldn't assume hard exclusion.
- **Failure:** a failed run is just a failed session; the next scheduled firing happens normally. `list_triggers.last_run` records `{status, fired_at, finished_at, session_id}`, and "a FAILED or repeatedly non-SUCCEEDED last_run is the signal that a Routine is not doing its job" (MCP schema). `/schedule why did my nightly review do nothing this morning?` reads run logs from the CLI. No documented auto-retry.
- **Long runs:** cloud sessions "stop after a period of inactivity and the VM is reclaimed" (web doc); no documented wall-clock limit on an active run.

## 5. Prompt best practices for fresh-session routines

From the routines doc plus MCP schema guidance:

- **Self-contained and explicit.** "The prompt is the most important part: the routine runs autonomously, so the prompt must be self-contained and explicit about what to do and what success looks like." The MCP schema echoes: a fresh-session prompt is "a complete standalone instruction since each firing starts from nothing."
- **No memory between firings.** State must live somewhere durable the next firing can read: the repo (docs, labels), GitHub issues/PRs, or "reads issues opened since the last run"-style time-window logic. The doc's backlog-maintenance example uses exactly this pattern.
- **Push detail into the repo.** Since the session loads CLAUDE.md and repo skills, keep the routine prompt short (identity + entry point) and put the evolving playbook in a committed doc/skill — editable by PR instead of via the routine form.
- **Opt in to fire text explicitly.** Run-specific text (API trigger `text`, **Run now** text) arrives wrapped in a `<routine-fire-payload>` block labeled untrusted; "a routine's saved prompt must opt in to acting on fire text ... or the routine treats the text as inert context."
- **Define the no-op path.** Tell the routine when to stop ("if nothing qualifies, say so and end") — this is what keeps quiet firings cheap and, combined with noteworthy-only notifications, silent.
- No documented hard prompt length limit for scheduled routines; the API `/fire` endpoint has field limits in its [API reference](https://platform.claude.com/docs/en/api/claude-code/routines-fire).

## Recommendation for the autonomic pipeline

Use **two fresh-session routines**: a daily triage sweep on a cheap model and a daily fix run on a stronger model, both with `push` notifications on (noteworthy-only keeps no-ops silent). Keep each prompt a short standalone pointer into a committed playbook doc/skill in this repo; carry all cross-firing state in GitHub issues/labels/PRs; enforce the open-PR cap inside the fix prompt by counting open `claude/` PRs at the start of every run, accepting a rare overshoot-by-one since firings can overlap. Scope the routine to this repo only, the Default (Trusted-network) environment, and no connectors beyond GitHub.
