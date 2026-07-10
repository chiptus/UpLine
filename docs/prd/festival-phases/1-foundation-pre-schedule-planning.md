# PRD: Festival phases (foundation + Pre-Schedule/Planning)

> Labels: `ready-for-agent`
> Scope: PR 1 of 3. Live and Post-Festival phases are separate follow-up PRDs (see Out of Scope).
> Related: builds on #46 (schedule reveal level, merged); sibling of #47 (progressive
> Schedule-tab rendering) — complementary, neither blocks the other (see "Coordination with #47").

## Problem Statement

A festival edition means very different things to a user at different points in
time, but UpLine presents the same UI throughout:

1. **Before the schedule is revealed**, a user only knows *some* of the artists
   who will play. They don't know how many sets each artist plays, on which
   stage, or at what time. Today the app still leads with a "Vote" tab full of
   sets that have no times — which reads as broken ("why are there no times?")
   rather than "the schedule isn't out yet."
2. **After the schedule is revealed but before the festival**, the user wants to
   plan: decide which sets to attend and coordinate with their group. This is
   the experience the app is currently built around.
3. **During the festival**, the user mostly wants to see the schedule — what's on
   now and next.
4. **After the festival**, the user wants to look back and record which sets they
   liked most.

The app has no concept of *where in this lifecycle an edition is*, so it can't
lead the user to the right thing at the right time, and the Pre-Schedule state
in particular looks like a bug.

## Solution

Introduce a **festival phase**: an ordered, *derived* lifecycle position for an
edition — **Pre-Schedule → Planning → Live → Post-Festival** — computed from
signals the platform already has (the edition's **schedule reveal level**, its
`start_date`/`end_date`, and the **festival timezone**). No new stored field.

The phase then drives how the edition is presented:

- The **default landing tab** shifts to what the user most wants in that phase.
- A compact **phase banner** explains the current moment (most importantly, it
  explains *why the schedule isn't visible yet* during Pre-Schedule, so that
  state stops looking broken).
- Small phase-aware copy touches (e.g. the primary tab reads **"Lineup"** in
  Pre-Schedule and **"Vote"** in Planning).

This PRD delivers the **derivation foundation plus the Pre-Schedule and Planning
phases**. Live and Post-Festival build on the same foundation in follow-up PRs.

## User Stories

1. As a festival-goer, I want the app to understand which phase an edition is in,
   so that it shows me the right thing without me configuring anything.
2. As a festival-goer during Pre-Schedule, I want a clear message that the
   schedule hasn't been revealed yet, so that missing set times read as "coming
   soon" rather than a broken page.
3. As a festival-goer during Pre-Schedule, I want to browse the confirmed
   lineup, so that I can see who is playing before the schedule exists.
4. As a festival-goer during Pre-Schedule, I want the primary tab to be framed as
   "Lineup", so that the framing matches the "here's who's coming" moment.
5. As a festival-goer during Pre-Schedule, I want to vote on artists (Must Go /
   Interested / Won't Go), so that I can express who I want to see even before I
   know when they play.
6. As a festival-goer during Pre-Schedule, I want the app to land me on the
   lineup by default, so that I start where the value is in that phase.
7. As a festival-goer when the schedule is revealed, I want the edition to move
   into Planning automatically, so that planning features appear the moment the
   Core Team reveals the schedule.
8. As a festival-goer during Planning, I want the primary tab framed as "Vote"
   and to land there by default, so that I can start deciding what to attend.
9. As a festival-goer during Planning, I want a banner that tells me the schedule
   is out and how long until the festival, so that I feel the anticipation and
   know to start planning.
10. As a festival-goer, I want the phase to be judged in the festival's own
    timezone, so that "the festival is over" doesn't flip early or late just
    because I'm checking from a different part of the world.
11. As a festival-goer, I want the Planning → (Live) boundary to open a day
    before the listed start date, so that early arrivers and campers see the
    festival treated as "happening" rather than "still upcoming." *(Boundary is
    defined here; the Live experience itself is a follow-up PR.)*
12. As a festival-goer, I want navigation to stay stable across phases (no tabs
    appearing or disappearing), so that the app doesn't feel like it's
    rearranging itself under me.
13. As a Core Team member, I want the phase to follow directly from the reveal
    level I already control plus the dates I already set, so that I don't have a
    new switch to remember to flip.
14. As a Core Team member, I want an edition with no dates set to still behave
    sensibly (never auto-advancing past Planning), so that a half-configured
    edition doesn't wrongly present as Live or over.
15. As a developer, I want phase derivation to be a single pure function with an
    injectable "now", so that every boundary and edge case is unit-testable
    without mocking the clock or the DOM.
16. As a developer, I want the phase exposed through a thin hook over the existing
    edition context, so that any component can ask "what phase are we in?" the
    same way it asks for the reveal level today.
17. As a developer, I want the phase concept written into the domain glossary and
    an ADR, so that the "derived, not stored" decision and its rejected
    alternatives are recorded for future work.

## Implementation Decisions

### Festival phase is derived, not stored
- A new **festival phase** concept with ordered values `pre-schedule`,
  `planning`, `live`, `post-festival`.
- Derived at read time from existing signals — **no new column**, no migration in
  this PR:
  - `schedule_reveal_level` (`draft | days | stages | full`)
  - `start_date`, `end_date` (both nullable `DATE` on the edition)
  - `festival.timezone` (IANA zone; already inherited by editions)
- Rejected alternatives (recorded in the ADR):
  - A `schedule_release_date` column — rejected because most festivals never
    announce when their schedule drops; we can't rely on that date existing.
  - A stored `phase` column — rejected as redundant; the phase is fully derivable
    and a stored copy would drift from the reveal level and dates.

### Derivation rules
Given `now` (an instant), all calendar boundaries evaluated **in the festival
timezone**:

| Phase | Condition |
| --- | --- |
| Pre-Schedule | `reveal_level === "draft"` |
| Planning | `reveal_level !== "draft"` AND `now < liveStart` |
| Live | `liveStart <= now <= liveEnd` |
| Post-Festival | `now > liveEnd` |

- `liveStart` = `start_date − 1 day` at `00:00`, festival-timezone wall clock.
- `liveEnd` = `end_date + 1 day` at `06:00`, festival-timezone wall clock (covers
  after-midnight closing sets before flipping to Post-Festival).
- **NULL dates degrade gracefully:** if `start_date` is missing, the edition can
  never reach Live/Post — the highest reachable phase is Planning (or
  Pre-Schedule while `draft`). If `end_date` is missing, Live has no upper bound
  and never flips to Post-Festival on its own.
- Pre-Schedule is strictly gated by `reveal_level === "draft"` and takes
  precedence: an edition still in `draft` is Pre-Schedule regardless of dates.

### Phase, reveal level, and publish state are orthogonal
- **Schedule reveal level** (ADR-0001) governs *what schedule detail is visible*
  (day/stage/time masking on sets). Unchanged by this PRD.
- **Festival phase** governs *how the edition is framed and where the user lands*.
- The Pre-Schedule → Planning transition is intentionally the same admin action
  as revealing the schedule (moving reveal level off `draft`) — one lever, not
  two.
- **Edition published** is unrelated and untouched.

### Module surface
- **New pure module — phase derivation.** Exposes `getFestivalPhase({ revealLevel,
  startDate, endDate, timezone, now })` returning the phase value, plus the
  boundary helpers it needs internally. Reuses the existing festival-timezone
  time utilities (the same `fromZonedTime`-based conversion used elsewhere) to
  compute `liveStart`/`liveEnd`; does not introduce a second timezone approach.
- **New hook — `useFestivalPhase`.** Thin wrapper that reads the edition +
  festival from the existing edition context and calls the pure function with the
  current time. Mirrors the existing `useScheduleReveal` hook shape exactly.
- **New component — phase banner.** Compact, single-line, phase-aware copy.
  Rendered in the edition layout. Deliberately minimal to avoid adding to
  existing header/nav visual clutter (broader de-clutter is a separate effort).
  - Pre-Schedule copy: lineup is live, schedule coming soon, vote for who you want
    to see.
  - Planning copy: schedule is out, countdown of days until `start_date`.
- **Tab navigation changes (behavioral, not structural).**
  - The existing tab config gains a **phase-driven default tab**: Pre-Schedule and
    Planning both default to the primary (sets) tab; Live → Schedule and
    Post-Festival → primary are defined for the follow-up PRs but the mechanism
    lands here.
  - The primary tab **label** is phase-aware: "Lineup" in Pre-Schedule, "Vote" in
    Planning.
  - **No tab is shown or hidden based on phase.** The tab set stays stable;
    content emptiness is handled by existing content-gating and by the
    reveal-level rendering on the Schedule tab. (Below `full`, the Schedule tab
    shows the `draft` placeholder today and — once #47 lands — real progressive
    day/stage views at `days`/`stages`. Either way the tab is never empty, which
    reinforces the "don't hide tabs by phase" decision rather than conflicting
    with it.)

### Coordination with #47 (progressive Schedule-tab rendering)
- **Different axes, one shared signal.** Festival phase is the edition's
  lifecycle position (Pre-Schedule → … → Post-Festival); #47 governs *what the
  Schedule tab renders* per `schedule_reveal_level`. Both read the reveal level;
  neither owns the other. They are consistent by construction: Pre-Schedule is
  exactly `reveal_level === "draft"` (where #47 keeps the placeholder), and
  Planning spans `days`/`stages`/`full` (the levels #47 renders progressively).
- **Two banners on two surfaces — keep them from fighting.** In Planning at
  `days`/`stages`, a user may see *both* this PRD's edition-layout **phase banner**
  (lifecycle framing + countdown) and #47's in-tab **embargo line** ("set times
  coming soon"). They live on different surfaces (edition layout vs. inside the
  Schedule tab), but stacked they add visual weight. This PRD's phase banner is
  deliberately one compact line for that reason; if both land, whichever PR is
  second should verify the combined result isn't cluttered and, if needed, defer
  to the header/banner de-clutter effort noted in Out of Scope.
- **Neither blocks the other.** This PR is migration-free and touches the edition
  layout + tab config; #47 touches Schedule-tab views/routing/filters. They can
  land in either order.

### Documentation deliverables (ship in this PR)
- **ADR `0003-festival-phase-derivation`**: records the "derived, not stored"
  decision, the derivation rules, the grace-period boundaries, NULL-date
  degradation, and the rejected `schedule_release_date` / stored-`phase`
  alternatives. Builds on ADR-0001 (reveal level) and ADR-0002 (timezone); no
  conflict.
- **`CONTEXT.md` glossary**: add **"Festival phase"** as an ordered, *derived*
  concept (parallel to how "Schedule" is defined as derived), listing the four
  values and noting it is not a stored entity.

## Testing Decisions

- **What makes a good test here:** exercise only the external behavior of the
  phase seam — inputs `(revealLevel, startDate, endDate, timezone, now)` →
  output phase. No mocking of the clock, DOM, or React; `now` is injected. Do not
  assert on internal boundary-helper structure.
- **Primary module under test:** the pure `getFestivalPhase` function. This is the
  single, highest seam and where every edge case lives:
  - `draft` reveal level ⇒ Pre-Schedule regardless of dates.
  - Non-`draft` before `liveStart` ⇒ Planning; at/after `liveStart` ⇒ Live.
  - `now` exactly on `liveStart` and `liveEnd` (inclusive boundaries).
  - The `−1 day @ 00:00` start grace and `+1 day @ 06:00` end grace, verified in a
    non-UTC festival timezone (e.g. `Europe/Lisbon`) so the timezone math is
    genuinely exercised, including an instant that is one calendar day in the
    viewer's zone but another in the festival's.
  - NULL `start_date` (never reaches Live/Post) and NULL `end_date` (Live never
    flips to Post).
- **Prior art:** `src/lib/timeUtils.test.ts` (existing timezone-boundary unit
  tests) and the `src/lib/scheduleReveal.ts` pure-lib + `useScheduleReveal` hook
  pattern this feature mirrors.
- The hook and UI (banner, default tab, label) are thin pass-throughs over the
  tested seam and are not separately unit-tested in this PR.

## Out of Scope

- **Live phase experience** (PR 2): "now / next" emphasis on the Schedule tab,
  current-set highlighting, etc. Only the Planning→Live *boundary* is defined
  here.
- **Post-Festival experience** (PR 3): a **retrospective rating** axis — a
  separate "how was it" signal, distinct from the anticipatory Vote — recording
  which sets a user liked most. Ships with its own `set_ratings` schema change,
  mutations, and rating UI.
- **Admin phase override** (PR 3): a nullable override column to force a phase for
  edge cases (delayed/cancelled festival). Deferred so this PR stays
  migration-free; it will land alongside the PR 3 migration.
- **Pre-Schedule → Planning set handling** (PR 3 concern, decided now): one set
  per artist during Pre-Schedule; when the schedule reveals an artist across
  multiple sets, existing votes copy to all of that artist's new sets.
- **Hiding tabs by phase** — explicitly not done; nav stays stable.
- **Header/banner visual de-clutter** — a known concern, handled in a separate PR.
- **Live phase reactivity** — no live ticker; phase is computed per render from
  the current time, which is sufficient at day-granularity boundaries.

## Further Notes

- **Domain vocabulary gap flagged for later:** the glossary currently defines
  **Vote** with *"Avoid: Rating, like."* The Post-Festival "how was it" signal is
  a genuinely new, distinct concept, not a synonym for Vote. When PR 3 lands it
  should add a **"Retrospective rating"** glossary term (and likely its own ADR)
  rather than overloading "Vote." Noting here so the distinction isn't lost.
- **New term introduced by this PR:** "Festival phase" is not yet in the glossary;
  this PR adds it (see Documentation deliverables).
- The four-phase model is designed as an ordered progression so later PRs slot in
  without reshaping the foundation.
