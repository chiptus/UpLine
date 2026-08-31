# Triage Labels

Every label the autonomic issue pipeline reads or writes, what it means, and who's allowed to apply it.

## Canonical triage-role labels

The skills speak in terms of five canonical triage roles. This table maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table. Applied by: the triage firing, via the triage skill.

Edit the right-hand column to match whatever vocabulary you actually use.

## Pipeline labels

Repo-specific labels the autonomic pipeline (`docs/agents/autonomic-issues.md`) uses outside the five canonical roles above — not part of the mattpocock/skills vocabulary, so a skill invocation won't look for them here.

| Label                            | Meaning                                                                                                                                                                            | Applied by                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `epic`                           | Tracking-only parent issue whose work has already been fully split into sub-issues, each carrying its own state label. Stays open only to track them; excluded from triage intake. | Triage firing — self-service, no maintainer confirmation needed |
| `agent:wip`                      | An agent has claimed the issue this firing.                                                                                                                                        | Fix firing                                                      |
| `agent:pr`                       | An agent PR for this issue is awaiting review.                                                                                                                                     | Fix firing (swapped from `agent:wip` on opening the PR)         |
| `priority:high` / `priority:low` | Steers fix-firing pick order.                                                                                                                                                      | Maintainer only — triage and fix never set these                |
| `wayfinder:*`                    | Belongs to a separate design/spec workflow, not this pipeline.                                                                                                                     | Never by this pipeline — triage skips these tickets entirely    |

## Category labels

`bug`, `enhancement`, `chore`, `refactor` — applied where obvious; self-explanatory, not part of either table above.
