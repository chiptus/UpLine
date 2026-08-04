# Prototype: active-scope

Route: `/prototype/active-scope?variant=A|B|C`

## Question

Does the "scope pin lives in Settings, header dropdown is a transient override"
model feel right, before touching `profiles` schema or real app code?

Background: PR #273 (issue #124) patched a bug where `profiles.active_group_id`
being `NULL` was overloaded to mean both "never chosen" and "explicitly
Everyone." The grill session (see conversation) converged on a bigger reframe:
Active Group and the future Vote Scope toggle (#125) are the same underlying
concept — a flat "scope" with entries `{your groups... | Everyone | Me}` — and
the fix should be root-cause, not another flag. Votes have no `group_id`
(confirmed in `supabase/migrations/20250620065433_create_artists_table.sql`),
so groups are purely a viewing/aggregation lens, never an identity a vote is
recorded against.

Product constraint from the user: the app should still centralize around "your
crew" as the default/sticky experience (that's the whole point of this epic),
so friction should sit on the _pin_ action (in Settings), not on casual
switching in the header.

## Variants

- **A — Star-marked dropdown**: one flat dropdown, pinned entry gets a star,
  a "back to X" pill appears next to the trigger when overridden.
- **B — Two-row split**: "Your default" (always-visible, one click home) is
  separated from a "Browse" dropdown for everything else.
- **C — Segmented + drawer**: a two-way segmented control (pinned vs. "More"),
  with other scopes revealed as chips only on demand — makes the pinned crew
  the single most prominent affordance, at the cost of one extra click to
  reach Everyone/Me.

## Verdict

_Not yet decided — fill in after clicking through all three variants._

## Cleanup

Once a variant wins (or the model is rejected), delete this whole
`src/routes/prototype/` directory and fold the winning interaction into the
real `ActiveGroupSwitcher` + a new Settings section, per PR #273's branch.
