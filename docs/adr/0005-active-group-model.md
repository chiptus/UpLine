# Active Group model for group-scoped votes

Status: accepted

We needed a way for users to view sets/artists filtered or scored by a Group's votes, on both the Schedule and Artists tabs, without re-selecting a group on every screen. We considered scoping group choice per festival edition (since a user's group might differ per festival), and considered a transient "peek at another group" mode that wouldn't overwrite the user's normal default. We rejected both: per-edition storage adds a second axis of state for a case we're not confident is common enough to justify, and a transient peek mode is a second concept (session-only vs. persisted) for uncertain benefit. Instead there is exactly one **Active Group** per user, global across editions, defaulted automatically when the user has exactly one Group and has never made an explicit choice.

Votes have no `group_id` (confirmed: `votes` belongs to the user alone — see `supabase/migrations/20250620065433_create_artists_table.sql`); Groups are purely a viewing/aggregation lens, never an identity a vote is recorded against.

## Two independent settings, not one flat pin target

An earlier version of this model stored a single nullable `active_group_id` and used `NULL` to mean both "never chosen" and "explicitly Everyone" — this shipped briefly, broke "Everyone" for any single-Group user (auto-activation always won), and was caught by manual testing. Root-causing rather than patching around it again: "which group is mine" and "which lens am I viewing through" are two independent questions.

- **`profiles.active_group_id`** — which of the user's Groups is theirs. A mostly-static, membership-like choice. `NULL` unambiguously means "no group chosen"; auto-derives to the sole Group when the user has exactly one.
- **`profiles.active_scope`** (`group` | `everyone` | `me`, nullable) — which lens is applied by default. When `group`, it resolves through `active_group_id`. `NULL` means "never explicitly chosen" — auto-derives the same way `active_group_id` used to: the sole Group when there's exactly one, else Everyone.

Both are set explicitly only from **Settings** (`src/pages/Settings/`) — this is the only "make it permanent" action; there is no separate per-pick "pin" button elsewhere.

## Asymmetric by design: header is a transient override, Settings holds the pin

The header switcher (`ActiveGroupSwitcher.tsx`) no longer writes either column directly. Selecting an entry there sets a **transient, in-memory override** (`ActiveScopeContext`, plain `useState`, not persisted) — it reverts to the Settings pin on a fresh visit/reload.

This is intentionally asymmetric, not symmetric: real Group picks are meant to stay sticky/default with no friction (that's the whole point of this epic — centralizing the app around "your crew"), while Everyone/Me are meant to default to being a temporary lens. Putting the friction on the Settings-level pin (not on casual switching in the header) serves that goal; a uniform "every header pick is a commit" model — the original #124 shape — does not.

The header dropdown lists the pinned entry first (starred), then remaining Groups, then remaining of Everyone/Me — so reverting to the pin is always the first item in the list, one open + one click. There's deliberately no separate "back to default" affordance next to the trigger: it would just add a second way to do what the starred, always-first entry already does.

## Unifies with the Schedule-tab Vote Scope

The three-way scope (`group` / `everyone` / `me`) is written to serve both the Artists tab's Vote Perspective (Everyone ↔ Group, no Me) and the Schedule tab's Vote Scope (Me ↔ Group, no Everyone) from one seam, rather than each inventing its own resolution/auto-activation logic. Issue #125 originally spec'd Vote Perspective and Vote Scope as independent, tab-local toggles; #310 shipped a different design instead — both tabs read their scope from the same shared `ActiveScopeContext`, so there is one scope selector, not two independently-settable ones, and "Me" simply isn't meaningful to Vote Perspective's rating aggregation, so it's treated as Everyone there.

## Considered Options

- **Single `active_group_id` column, "never chosen" and "explicitly Everyone" both `NULL`.** Rejected: the modeling bug this ADR fixes.
- **`active_group_id` + a boolean "has explicitly chosen" flag on the same nullable column.** Considered and briefly shipped (`active_group_selected`). Rejected in favor of the two-setting model below: it papered over the ambiguity rather than removing it, and gave "Active group" and "Active scope" no separate existence — a user could not pin "my crew" as a standing identity while defaulting their day-to-day view to Everyone.
- **Two independent settings, header as a durable pin for both (chosen for `active_group_id`, rejected as-is for the header/scope relationship).** Symmetric treatment of every switcher entry (uniform pin-on-select) was the original #124 shape. Rejected once reframed against the epic's actual goal: it puts equal friction on picking your crew and picking a one-off "everyone" peek, when the two should not have equal friction.
- **Two independent settings + asymmetric pin-in-Settings, transient header override (chosen).** Prototyped as three UI variants (`chiptus/UpLine#288`, throwaway, never merged) before picking the flat starred-dropdown shape described above.

## Consequences

- `src/lib/activeGroup.ts` exports `resolveActiveGroupId` (unchanged shape, now scope-independent) and `resolvePinnedScope` (new), both pure and framework-free.
- `src/contexts/ActiveScopeContext.tsx` is the single seam every scope-aware surface reads from: `pinned` (durable), `current` (transient), and the two Settings-only mutators `setActiveGroup` / `setActiveScope`.
- `src/pages/EditionView/tabs/VoteTab/FilteredSetsPanel.tsx`'s Vote Perspective toggle seeds its default from `current`, mapping `me` to `everyone` since Vote Perspective has no Me option.
- Any future Vote Scope work (Schedule tab, Me ↔ Active Group, issue #125) reuses `ActiveScopeContext` directly; it does not need its own auto-activation or override tracking.
