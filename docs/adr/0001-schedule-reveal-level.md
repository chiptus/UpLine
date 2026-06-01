# Schedule visibility uses an ordered reveal level, not a boolean

Festivals progressively reveal their schedule in phases (lineup → days → stages → exact times), so a single `schedule_published` boolean was insufficient. We model schedule visibility as an ordered enum `schedule_reveal_level` on `festival_editions` with values `draft < days < stages < full`. Each level reveals strictly more set fields (`time_start` date → `stage_id` → time-of-day + `time_end`) to non-admins. The level is independent of `edition.published` — that flag governs the lineup and voting; this enum governs the "when/where" layer of the lineup.

## Considered Options

- **Boolean `schedule_published`.** Rejected: didn't fit phases like "stages known, times not yet" that the domain expert called out.
- **Independent booleans (`days_published`, `stages_published`, `times_published`).** Rejected: gives 8 combinations, half nonsensical (e.g. times without days). Ordered enum captures the natural reveal progression and prevents bad states.
- **Separate `schedules` entity with versioned drafts.** Rejected as out of scope: heavy data-model change for a workflow festivals rarely use (re-publishing a different version), when live-writes with a commit warning cover the same need.
- **Per-day or per-stage granularity (publish Friday before Saturday).** Considered but not adopted: orthogonal axis to the reveal level, can be added later without breaking the enum.

## Consequences

- Reading set timing/stage fields for non-admins is masked **on the client** based on the edition's reveal level. We deliberately chose this over a server-side view for simplicity. The trade-off: the embargoed fields (`time_start` time-of-day, `time_end`, `stage_id`) are still sent on the wire — anyone with devtools or direct Supabase access can read them. Acceptable because the schedule is embargoed, not secret. If we ever need true leak-proofness, the upgrade path is a `public_sets` view + revoke of public SELECT on `sets`.
- "Stages always implies days" is enforced by the ordering. If we ever need "stages without days," the enum must be replaced with independent flags — that's a breaking change.
- The Schedule tab's UI for `days` and `stages` is deliberately deferred: it shows the existing "coming soon" placeholder until `full`, while the progressive reveal manifests on Artist-tab SetCards. A multi-mode Schedule tab is tracked as a separate task.
