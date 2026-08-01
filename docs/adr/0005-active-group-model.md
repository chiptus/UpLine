# Active Group model for group-scoped votes

Status: accepted

We needed a way for users to view sets/artists filtered or scored by a Group's votes, on both the Schedule and Artists tabs, without re-selecting a group on every screen. We considered scoping group choice per festival edition (since a user's group might differ per festival), and considered a transient "peek at another group" mode that wouldn't overwrite the user's normal default. We rejected both: per-edition storage adds a second axis of state for a case we're not confident is common enough to justify, and a transient peek mode is a second concept (session-only vs. persisted) for uncertain benefit. Instead there is exactly one **Active Group** per user, global across editions, stored on `profiles.active_group_id`, defaulted automatically when the user has exactly one Group and has never made an explicit choice. Picking a different entry in the switcher — including "Everyone" — always overwrites it; there is no non-persisting alternative.

The Active Group feeds two independent, tab-local toggles rather than one shared switch: **Vote Perspective** (Artists tab, Everyone ↔ Active Group, re-scores without hiding) and **Vote Scope** (Schedule tab, Me ↔ Active Group, hides non-matching sets). These are kept separate because they do different jobs — a user may want the group's aggregate popularity on Artists while checking only their own Must-Gos on Schedule — and collapsing them into one global toggle would force those two intents to always move together. Both toggles resolve their votes through one shared, framework-free function, `resolveVotesForScope` (`src/lib/voteScope.ts`), rather than each re-implementing group-membership filtering.

Group-scoped vote matching on the Schedule tab uses "any member of the Active Group cast that vote type," not a majority or average threshold — chosen for a first version because it's the simplest mental model and reuses the client-side membership-filter pattern already proven in the Artists tab, rather than introducing new aggregate math. This can be revisited once real usage shows whether "any member" over- or under-includes sets for larger groups.

## Explicit "Everyone" vs. never-chosen (profiles.active_group_selected)

Auto-activation and an explicit "Everyone" selection both need to persist `active_group_id = NULL`, but they mean opposite things: "never touched the switcher yet, so auto-activate my one Group" vs. "I explicitly chose to see everyone's votes, don't auto-activate." A single nullable column can't distinguish them — implemented naively, a user with exactly one Group could never actually select "Everyone," because auto-activation would immediately override it back. `profiles.active_group_selected` (boolean, defaults `false`) resolves this: `resolveActiveGroupId` (`src/lib/activeGroup.ts`) only auto-activates the sole Group while the flag is `false`; any switcher interaction sets it `true`, after which a `NULL` `active_group_id` is trusted to mean Everyone.

**This sub-decision is under active reconsideration.** Durable, cross-device persistence of "Everyone" (the behavior above) is what's shipped and what this ADR's parent decision — "every switcher selection persists, no preview mode" — implies. But it's an open question whether users actually want "Everyone" to be *that* sticky, versus a lighter, session-scoped choice. See the handoff for that discussion; whatever this resolves to should also apply to Vote Scope's Me/Group choice, since both read the same `useActiveGroup` seam.

## Considered Options

- **Single `active_group_id` column, "never chosen" and "explicitly Everyone" both `NULL` (rejected in practice).** Simplest schema, but silently breaks "Everyone" for any single-Group user — auto-activation always wins. This shipped briefly and was caught by manual testing.
- **`active_group_id` + `active_group_selected` boolean (chosen).** One extra column distinguishes intent without overloading `NULL`, and keeps auto-activation, explicit-Everyone, and explicit-Group-choice as three cleanly distinguishable states.
- **Drop single-Group auto-activation entirely.** Simpler schema (no flag needed), but regresses the "zero-setup default" guarantee for single-Group users — the case #123 was written to guarantee in the first place.
- **Track "explicitly Everyone" client-side only (session/local storage), no new column.** Avoids a migration, but breaks cross-device/cross-session persistence for the Everyone case specifically, which the switcher's other entries don't do — a user's choice would behave inconsistently depending on which entry they picked.

## Consequences

- `src/lib/activeGroup.ts`'s `resolveActiveGroupId` takes `hasExplicitSelection` alongside `profileActiveGroupId` and `groupIds`; any caller resolving Active Group must thread the new field through (`useActiveGroup.ts` reads it off `profile.active_group_selected`).
- `useSetActiveGroupMutation` sets `active_group_selected: true` on every switcher pick, including "Everyone" — there's no code path that writes `active_group_id` without also marking the selection explicit.
- Any future Vote Scope work (Schedule tab, Me ↔ Active Group) reuses this same Active Group state; it does not need its own auto-activation or explicit-selection tracking.
