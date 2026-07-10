# PRD: Festival phases — PR 3: Post-Festival phase

> Labels: `ready-for-agent`
> Parent: Festival phases (epic, `0-epic.md`). Depends on PR 1 (phase derivation + `useFestivalPhase`).
> Scope: PR 3 of 3. **One migration** (retrospective rating storage + admin phase-override column).

Read the epic first for the four-phase model, the derivation rules, and the
cross-phase decisions. This PRD specifies only the **Post-Festival** phase, the
**retrospective rating** axis it introduces, and the **admin phase override**
(bundled here because it needs the one migration in this epic).

## Problem Statement

After a festival ends, a user's relationship to the edition changes again: they
no longer plan or navigate — they **remember**. They want to record which sets
they actually liked most, and look back on their festival. Today the app can't
express this at all:

1. **There is nowhere to say "I loved that set."** The only reaction the app
   stores is a **Vote** — but a Vote is *anticipatory* ("will I go"), captured
   while planning. Reusing it after the fact would either overwrite the user's
   planning intent or force a "Won't Go" set they actually attended into a
   nonsensical state. The retrospective question ("how was it") is genuinely
   different from the anticipatory one.
2. **The app keeps presenting a festival that's over as if it were still ahead** —
   same default tab, same planning framing — with no acknowledgement that it
   happened and no invitation to reflect.
3. **When a festival is delayed, cancelled, or the dates were entered wrong, the
   Core Team has no way to correct the phase** — it is purely date-derived, so a
   postponed festival can wrongly show as Live or Post-Festival.

## Solution

When the edition is in the **Post-Festival** phase (from the epic: `now >
liveEnd`, festival-timezone), reframe the experience around reflection:

- Introduce a **retrospective rating** — a user's after-the-fact reaction to a
  **set** they experienced ("how was it") — stored **separately from Vote** so
  planning intent is never destroyed. Vote answers "will I go"; rating answers
  "did I like it."
- Put the primary tab into a **rating mode**: the same set list, but the action
  is "rate this set" rather than "vote."
- Show a compact **Post-Festival banner** inviting reflection ("how were your
  sets?").

Separately, give the **Core Team a manual phase override** so they can force a
phase (e.g. keep an edition in Planning after a postponement, or open
Post-Festival early) when the date-derived value is wrong. This lands in this PR
because it is the only schema change in the epic and belongs with the migration.

## User Stories

1. As a festival-goer after the festival, I want to record which sets I liked
   most, so that I can remember the highlights and inform future decisions.
2. As a festival-goer, I want rating a set to be a **separate** action from the
   Vote I cast while planning, so that reflecting on the festival doesn't erase
   what I had planned to see.
3. As a festival-goer, I want to rate a set I ended up attending even if I had
   voted "Won't Go" (or never voted) on it, so that my rating reflects reality,
   not my earlier plan.
4. As a festival-goer after the festival, I want the primary tab to shift into a
   rating mode, so that reflecting is the obvious thing to do without hunting for
   it.
5. As a festival-goer after the festival, I want the app to land me somewhere that
   acknowledges the festival is over, so that it doesn't feel like it's still
   asking me to plan.
6. As a festival-goer, I want a compact banner inviting me to rate my sets, so
   that the post-festival context is explicit and consistent with other phases.
7. As a festival-goer, I want to change or remove a rating I gave, so that I can
   correct myself.
8. As a festival-goer, I want the "festival is over" transition judged in the
   **festival's** timezone, so that it doesn't flip early or late based on where
   I am.
9. As a Core Team member, I want to override the derived phase for an edition, so
   that a delayed, cancelled, or mis-dated festival shows the correct phase.
10. As a Core Team member, I want the override to be optional and to fall back to
    the derived phase when cleared, so that normal editions need no attention.
11. As a developer, I want the override to compose cleanly with the pure
    derivation from PR 1, so that "effective phase = override ?? derived" is the
    single rule everything reads.
12. As a developer, I want the retrospective rating persisted through a
    data-access module mirroring the existing voting module, so that it fits the
    codebase's established patterns.
13. As a developer/maintainer, I want the "rating is separate from Vote" decision
    recorded in an ADR and the glossary, so that future work doesn't collapse the
    two.

## Implementation Decisions

### Retrospective rating is a separate axis from Vote (locked in the epic)
- **New storage — `set_ratings`** (its own table), distinct from `votes`. A rating
  is a user's retrospective reaction to a **set**. One rating per `(user_id,
  set_id)` (unique constraint), independent of any Vote the user cast on that set.
  Anticipatory Vote and retrospective rating coexist for the same set.
- **Scale:** a small ordered set of values (e.g. loved / liked / meh). Exact value
  set is an implementation detail of this PR, but it is a *retrospective* scale,
  **not** the Vote scale, and rating copy never reuses "Must Go / Interested /
  Won't Go."
- **Never overwrites a Vote.** Rating writes go only to `set_ratings`; `votes` is
  untouched by rating actions.
- **RLS / access** mirrors `votes`: a user manages their own ratings; visibility
  follows the same rules votes already use (incl. group context if applicable).
  Match whatever `votes` does rather than inventing a new policy shape.

### Post-Festival phase behavior
- **Trigger:** `useFestivalPhase() === "post-festival"` (from PR 1). No new date
  logic — the epic's `liveEnd` boundary already defines it.
- **Default landing tab:** the primary (sets) tab, in **rating mode** (per the
  epic's phase→UX contract). Uses PR 1's phase-driven default-tab mechanism.
- **Rating mode on the primary tab:** the same set list and cards, but the
  per-set action is **rate** (writes `set_ratings`) instead of **vote**. Reuse the
  existing set-card/set-row; swap the action control based on phase. Set-detail
  links remain.
- **Banner:** reuse PR 1's compact phase-banner component with Post-Festival copy
  (e.g. "The festival's over — how were your sets?"). One unobtrusive line.
- **Navigation stays stable** — no tabs added or hidden (epic rule). Other tabs
  (Schedule, etc.) remain reachable for reference.

### Admin phase override (the epic's one schema change)
- **New nullable column on the edition** holding an optional forced phase
  (`pre-schedule | planning | live | post-festival`, or null). Null ⇒ use derived.
- **Effective phase = override ?? derived.** PR 1's `useFestivalPhase` (and/or the
  pure `getFestivalPhase` caller) reads the override first and only falls back to
  the derived value when it is null. Keep this the single rule; do not scatter
  override checks.
- **Core Team UI:** a control in the edition admin area to set/clear the override,
  alongside the existing schedule-reveal-level control (`ScheduleRevealControl`
  and siblings under `src/pages/admin/festivals/`). Clearing returns the edition
  to automatic behavior.
- This is the migration this PR ships; the retrospective-rating storage rides the
  same migration.

### Documentation deliverables (ship in this PR)
- **ADR-0004 — Retrospective rating is separate from Vote:** records why post-
  festival rating is its own axis/storage rather than reusing or overwriting
  votes (anticipatory vs. retrospective; preserving planning intent). References
  the epic and ADR-0003.
- **`CONTEXT.md` glossary — "Retrospective rating":** a user's after-the-fact
  reaction to a **set** ("how was it"), distinct from **Vote** (anticipatory).
  The glossary currently lists Vote → *Avoid: Rating*; this entry establishes
  rating as a separate, legitimate concept and cross-references Vote so the two
  aren't conflated.

## Testing Decisions

- **What makes a good test here:** exercise external behavior at the data-access
  seam and the override rule — not component internals.
- **Retrospective rating mutation** (primary module under test): the
  create/update/remove behavior of the rating data-access module. Cases: first
  rating inserts; re-rating the same set updates (unique on `user_id,set_id`);
  clearing removes; a Vote on the same set is unaffected by any rating write and
  vice versa. **Prior art:** the voting module — `src/api/voting/useVote.ts`
  (optimistic upsert with `onConflict: "user_id,set_id"`, key factories in
  `src/api/voting/types.ts`); mirror its structure and its optimistic-update test
  approach.
- **Effective-phase override** (pure): extend PR 1's `getFestivalPhase` seam (or
  its caller) so `override ?? derived` is unit-tested — a non-null override wins
  over every derived case; null falls through to the derived value. `now`
  injected, same pure-seam shape as PR 1.
- The rating-mode UI, banner, and default-tab wiring are thin consumers of the
  tested seams and PR 1's hook; not separately unit-tested.

## Out of Scope

- **Aggregate rating displays / leaderboards** ("top-rated sets of the festival",
  group rating rollups, stats dashboards) — valuable follow-up, not this PR. This
  PR captures individual ratings; surfacing aggregates is separate.
- **Rating anything other than a set** (rating artists, stages, the festival
  overall) — out of scope; ratings attach to sets only.
- **Re-opening rating during Live** — ratings are a Post-Festival action here;
  whether to allow rating a set the moment it ends (during Live) is a possible
  later refinement, not this PR.
- **Migrating or backfilling** existing votes into ratings — none; the axes are
  independent by design.
- **Pre-Schedule → Planning set-split / vote-copy** — a separately-tracked concern
  (decided in the epic); it is not triggered by rating and is not part of this PR.
- **Changes to Live "now/next"** (PR 2) or Pre-Schedule/Planning (PR 1).

## Further Notes

- This PR closes the four-phase arc: with Post-Festival implemented, every
  lifecycle position has a defined experience and the phase→UX contract in the
  epic is fully realized.
- The override column is intentionally minimal (a single optional forced phase),
  not a scheduling system — it is an escape hatch for wrong/derived phases, not a
  way to pre-program phase transitions.
- Keep rating copy and iconography visibly distinct from Vote's so users never
  read the retrospective action as re-voting.
