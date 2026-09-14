# Triage Labels

Every label the autonomic issue pipeline reads or writes, what it means, and who's allowed to apply it.

## Canonical triage-role labels — a mutually-exclusive Linear label group

The skills speak in terms of five canonical triage roles. In Linear these five live together in a single **label group** (Linear's mutually-exclusive label set): applying one automatically clears any other member of the group from the issue, so an issue can never carry two triage-role labels at once. Group setup: `docs/agents/autonomic-issues.md`'s setup checklist.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table. Applied by: the triage firing, via the triage skill.

Edit the right-hand column to match whatever vocabulary you actually use.

## Pipeline labels — lifecycle markers, kept outside the triage group

Repo-specific labels the autonomic pipeline (`docs/agents/autonomic-issues.md`) uses outside the five canonical roles above — not part of the mattpocock/skills vocabulary, so a skill invocation won't look for them here. These are lifecycle markers, not triage roles: they stay standalone (not in the label group above) because they track pipeline progress alongside a triage-role label, not instead of one — an issue can be `ready-for-agent` and `agent` at the same time.

| Label         | Meaning                                                                                                                                                                                       | Applied by                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `epic`        | Tracking-only parent issue whose work has already been fully split into sub-issues, each carrying its own state label. Stays open only to track them; excluded from triage intake.            | Triage firing — self-service, no maintainer confirmation needed |
| `agent`       | An agent currently owns this issue or has an open PR for it. The stage isn't a separate label — it's the issue's native status: `In Progress` while claimed, `In Review` once the PR is open. | Fix firing                                                      |
| `wayfinder:*` | Belongs to a separate design/spec workflow, not this pipeline.                                                                                                                                | Never by this pipeline — triage skips these tickets entirely    |

(Superseded 2026-09-13: this repo previously tracked the same two stages with separate `agent:wip`/`agent:pr` labels; those labels have been retired in Linear now that status covers the distinction.)

## Priority

Fix-firing pick order is steered by Linear's native `priority` field on the issue (not a label): `1` Urgent, `2` High, `3` Medium, `4` Low, `0`/unset No priority. Maintainer only — triage and fix never set it. (Superseded 2026-09-12: this repo previously used `priority:high`/`priority:low` labels for the same purpose; those labels have been deleted from Linear now that the native field covers it.)

## Category labels

`bug`, `enhancement`, `chore`, `refactor` — applied where obvious; self-explanatory, not part of either table above.
