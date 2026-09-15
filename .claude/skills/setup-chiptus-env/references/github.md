# GitHub tracker specifics

Reached from `autonomic-issues.md`'s "Tracker specifics" pointer when this repo's tracker is GitHub. Read this file whenever that doc says "per Tracker specifics" and the tracker is GitHub — it holds every GitHub-specific mechanic the pipeline needs; nothing here repeats what the tracker's own `gh`/API `usage`/`--help` already documents.

## Claimed / in review

One label (`agent`), applied at claim time and never swapped. Stage is inferred, not stored: no open linked PR yet = claimed; an open linked PR (via `Closes #<n>`) = in review — its own draft/ready-for-review/merged state already tells you which, no second label needed.

## Priority order

No native field. If this repo wants one, a `priority/*` label (maintainer-set, triage/fix never write it) — otherwise oldest-first.

## Issue↔PR link

`Closes #<n>` in the PR body — GitHub-native, transitions the issue on merge.

## Lifecycle labels

`agent` / `epic` are lifecycle markers, alongside whichever triage-role label the issue also carries. Don't add a second label for PR stage (e.g. `status/in-review`) — the PR's own state is the signal, and a label would just re-encode it.

## Triage-role exclusivity

No native label group — GitHub has nothing like Linear's mutual-exclusivity feature. The one-role-at-a-time rule from `docs/agents/triage-labels.md` still applies; it's just enforced by discipline instead of the tracker: the triage skill must remove any other triage-role label before applying a new one, since nothing here does it automatically.

## Label naming convention

Every prefixed label in this repo uses `/` as the delimiter (`triage/ready-for-agent`, `priority/high`, `agent/wip`, …), not `:`. This is a plain naming convention only — GitHub gives `/` no functional or visual grouping treatment (unlike Linear's real parent-label grouping, see `references/linear.md`), so don't describe it to users as achieving Linear-style grouping. It's picked purely for consistency across the label set.

If this repo has pre-existing `:`-delimited labels, rename them to `/` in place (GitHub label renames preserve their history and issue associations) rather than leaving a mixed convention.
