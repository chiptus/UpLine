# Linear tracker specifics

Reached from `autonomic-issues.md`'s "Tracker specifics" pointer when this repo's tracker is Linear. Read this file whenever that doc says "per Tracker specifics" and the tracker is Linear — it holds every Linear-specific mechanic the pipeline needs; nothing here repeats what `linearis` usage/`--help` already documents.

## Claimed / in review

One label (`agent`) plus the issue's native status: `In Progress` while claimed, `In Review` once the PR is open. Query both together (`--label agent --status "In Review"`) — status alone would also catch a maintainer's own manually-opened PR.

## Priority order

Native `priority` field: Urgent(1) → High(2) → Medium(3) → Low(4) → No priority(0). Maintainer-set; triage/fix never write it.

## Issue↔PR link

The Linear identifier (e.g. `<TEAM>-123`) in the PR title or body — `Closes #N` does nothing for a Linear issue. Linear's GitHub integration does the transition on merge.

## Lifecycle labels

`agent` / `epic` are lifecycle markers, standalone from the mutually-exclusive triage-role label group (`docs/agents/triage-labels.md`).

## Triage-role exclusivity

Structural — the label group itself clears any other triage-role label the moment a new one is applied (`docs/agents/triage-labels.md`). Labels keep plain names (`ready-for-agent`, not `triage/ready-for-agent`); the grouped look comes from each label's `parent` pointing at the `triage` group, which Linear's own UI renders hierarchically — nothing to prefix by hand.
