# PRD: Festival phases — PR 2: Live phase

> Labels: `ready-for-agent`
> Parent: Festival phases (epic). Depends on PR 1 (phase derivation + `useFestivalPhase`).
> Scope: PR 2 of 3. No schema change.

Read the epic first for the four-phase model, the derivation rules, and the
cross-phase decisions. This PRD specifies only the **Live** phase experience.
The Planning→Live→Post boundaries and the Live phase's place in the phase→UX
contract are already defined in the epic and PR 1; this PR builds the Live
experience on that foundation.

## Problem Statement

Once a festival is actually happening, a user's need flips. During Planning they
were deciding *what to attend*; now, on-site, they want to know **what's on right
now and what's next** — quickly, without scrolling a full multi-day schedule or
re-deriving the current time in the festival's timezone. Today the app makes no
distinction: the festival being live looks exactly like Planning — it still lands
on the Vote tab, and the Schedule shows the whole run with nothing marking "now."

## Solution

When the edition is in the **Live** phase (defined in the epic:
`liveStart <= now <= liveEnd`, festival-timezone), adapt the experience for a
person standing in the field:

- **Land on the Schedule tab** by default (instead of the primary/Vote tab).
- On the Schedule, **surface "now / next"**: clearly mark the sets that are
  **playing now** and the ones **coming up next**, and make them the first thing
  the user sees — without removing access to the full schedule.
- Show a **compact Live banner** ("the festival is on") consistent with PR 1's
  banner treatment.

Voting stays fully available (last-minute decisions happen on-site); nothing from
Planning is removed. Live is an *emphasis shift*, not a different app.

## User Stories

1. As a festival-goer on-site, I want the app to open on the Schedule when the
   festival is live, so that I immediately see what's happening rather than a
   voting list.
2. As a festival-goer on-site, I want the sets that are **playing now** clearly
   marked, so that I can see current options at a glance.
3. As a festival-goer on-site, I want to see **what's on next** (the upcoming
   sets), so that I can plan my next move without reading the whole schedule.
4. As a festival-goer on-site, I want "now" judged in the **festival's**
   timezone, so that current/next is correct regardless of my phone's timezone.
5. As a festival-goer on-site, I want the full day/stage schedule still reachable,
   so that I can look further ahead than just "next."
6. As a festival-goer on-site, I want to still vote/change votes, so that I can
   record last-minute decisions while I'm there.
7. As a festival-goer, I want a compact banner telling me the festival is on, so
   that the live context is explicit and consistent with other phases.
8. As a festival-goer whose phase is Live but whose schedule reveal level is not
   yet `full`, I want the experience to degrade sensibly, so that I still see
   whatever the reveal level allows without broken "now / next" for hidden times.
9. As a developer, I want "now / next" to be a pure, testable derivation over
   `(sets, now)`, so that the current/upcoming classification is verifiable
   without a running clock.

## Implementation Decisions

### Trigger
- Gate entirely on `useFestivalPhase() === "live"` (from PR 1). No new date logic
  here — the epic's `liveStart`/`liveEnd` boundaries already define Live.

### Default landing tab
- Extend PR 1's phase-driven default-tab mechanism so **Live → Schedule**. PR 1
  already introduced the mechanism (and defined this mapping); this PR just
  ensures the Schedule tab is the mapped default and lands correctly. Navigation
  stays stable — no tabs added or hidden.

### "Now / Next" surfacing (Schedule tab)
- A **new pure derivation** classifies each set relative to `now` (festival-tz):
  **now-playing** (`time_start <= now < time_end`), **next** (the nearest
  upcoming sets after `now`), or **later/past**. This is the PR's key seam —
  `(sets, now) → classification` — mirroring `getFestivalPhase`'s pure/injectable
  `now` shape. It reuses the existing set timing already loaded for the Schedule
  and the festival-timezone helpers in `timeUtils`.
- The Schedule tab, when Live, leads with a **"Now / Next" section** built from
  that classification, above the existing full views. Now-playing sets are
  visually marked as current; the next block shows the immediately upcoming sets.
- The existing full Schedule (Timeline / List, or #47's progressive views below
  `full`) remains available below/after the Now-Next section — the user can still
  browse the whole run.
- **Reuse the existing masked set row** (the same `MobileSetCard`/set-row used
  elsewhere) so voting, set-detail links, and self-hiding stage/time badges come
  for free and honor the reveal level.

### Reveal-level interaction
- "Now / Next" needs `time_start`/`time_end`, which only exist at reveal level
  `full`. If Live is reached while the reveal level is below `full` (unusual but
  possible), **fall back gracefully**: skip the Now-Next section (no times to
  classify) and show whatever the reveal level renders (#47's progressive views
  or the placeholder), plus the Live banner. Do not fabricate or leak hidden
  times.

### Banner
- Reuse PR 1's compact phase-banner component with Live copy (e.g. "The festival
  is live — here's what's on now"). One unobtrusive line.

### No live ticker
- Per the epic, no background timer. "Now / Next" is computed from the current
  time on render/navigation. A set that ended a few minutes ago updating on the
  next interaction is acceptable; a self-updating clock is explicitly out of
  scope for this PR.

## Testing Decisions

- **What makes a good test:** exercise the external behavior of the **now/next
  derivation** — inputs `(sets, now)` (and timezone) → which sets are
  now-playing / next / other. `now` injected; no clock, DOM, or React mocking.
- **Primary module under test:** the pure now/next classifier. Cases:
  - `now` inside a set's `[time_start, time_end)` ⇒ now-playing; exactly at
    `time_end` ⇒ no longer now-playing.
  - Nearest upcoming set(s) selected as "next"; ties and multi-stage concurrency
    handled deterministically.
  - Classification computed in a **non-UTC festival timezone**, including an
    instant that is a different calendar day in the viewer's zone.
  - Sets with missing/again-masked times excluded from now/next without error.
- **Prior art:** `src/lib/timeUtils.test.ts` and PR 1's `getFestivalPhase` tests
  (same pure-seam + injected-`now` shape).
- The default-tab wiring, banner, and Schedule rendering are thin consumers of the
  tested seam and PR 1's hook; not separately unit-tested.

## Out of Scope

- **Countdown timers / self-updating "now"** — no live ticker (epic decision).
- **Post-Festival rating** — PR 3.
- **Admin phase override** — PR 3 (Live is reached via dates here).
- **Push/notifications** ("your must-go starts in 10 min") — not in this epic.
- **Changes to `full` Timeline/List rendering** beyond adding the Now-Next section
  above them, and beyond #47's separate progressive-rendering work.
- **Personalized "next" based on the user's votes** (e.g. only their must-go
  upcoming sets) — possible later polish; this PR's "next" is schedule-wide.

## Further Notes

- The now/next classifier is deliberately a standalone pure function (not baked
  into a component) so PR 3 or later personalization can reuse it.
- Coordination with #47: below `full`, #47 owns Schedule-tab rendering; this PR's
  Now-Next section simply doesn't appear there (no times), so the two don't
  collide.
