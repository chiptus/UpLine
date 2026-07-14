# Handoff: timeline navigation, filtering & my-vote chips — prototype done, PRD next

## What the next session is for

The `/prototype` UI-branch work is finished and a winning direction is picked.
Run `/to-prd` to synthesize everything below (plus
`HANDOFF_TIMELINE_NAV_PROTOTYPE_NOTES.md` in this same directory) into a real
PRD and publish it to GitHub Issues with `ready-for-agent` — no interview
needed, these two docs already contain every decision. Then the real
implementation starts (separate session/ticket).

## Status of the wider effort

- Original design handoff (2026-07-09 grilling session) is superseded by
  this doc for anything the prototype touched — that doc's "Agreed design"
  section (navigation/scrollTo/filtering constraints) still holds and is
  reproduced below so `/to-prd` doesn't need to chase it down.
- Prototype built, tested with 2 real users across two rounds, verdict
  captured. **Winner: the synthesized "variant c" direction** (see below) —
  not literally round-1's mini-map, but the round-2 evolution of it.
- All prototype **code** lived on branch `claude/timeline-nav-prototype`
  (PR **#121**, github.com/chiptus/UpLine/pull/121). That branch/PR is
  throwaway per the `/prototype` skill's rules — do not merge it. This
  branch (`claude/timeline-nav-handoff-docs`) intentionally carries **no
  code**, only this handoff and the copied verdict notes, so the docs
  survive independently of the prototype branch being deleted.
- A separate deferred topic — group-vote filtering ("votes by me/my crew")
  — has its own handoff doc from the original session
  (`handoff-group-vote-filtering.md`, delivered to the owner). Still don't
  pull it into this PRD.
- Prototype code is **not yet deleted** (still on PR #121). Once the PRD is
  published, delete it per the list at the top of
  `HANDOFF_TIMELINE_NAV_PROTOTYPE_NOTES.md` — either now or when the real
  implementation lands.

## Agreed design (constraints from the original 2026-07-09 grilling session)

**Navigation (Timeline view only) — "navigation scrolls, it never hides":**

- Keep the continuous horizontal strip (all days end-to-end). No day tabs.
- Sticky slim jump bar above the timeline: one button per festival day + a
  **"Now"** button.
- "Now" button and a vertical current-time indicator line exist **only**
  while the current time (festival timezone) falls inside the festival
  window; hidden otherwise — never disabled. Indicator updates every 60s.
- On mount: one-time positioning, then no programmatic scrolling ever except
  jump-control clicks. No auto-follow, no user setting.

**Scroll position lives in the URL:**

- `scrollTo=<datetime>` search param = the moment at the **viewport
  center**. Absent by default.
- User scrolling writes it debounced (~300ms scroll-idle), rounded to
  5-minute granularity, via history **replace** (no history spam). This
  makes back-from-a-set-page restore position for free, and makes moments
  shareable links. **Confirmed working** during prototyping — reload and
  back-navigation both restore position correctly.
- One-way ownership rule to avoid feedback loops: URL → scroll only on
  mount and on jump-control clicks; user scroll → URL only. Jump bar buttons
  just write `scrollTo` (declarative, one code path).
- Mount precedence: `scrollTo` in URL → that moment; else `day` filter →
  day start; else now inside festival window → now −1h context; else
  festival start.

**Filtering (shared across Timeline + List views) — "filtering narrows, it
never scrolls":**

- The day / time-of-day / stage filter panel becomes a shared component on
  both Schedule views. **Amended during prototyping**: this now lives in a
  bottom sheet (see Winning direction below), not a collapsed inline panel
  as originally imagined — testing showed the inline panel competed with
  the schedule for visual space. Day filter stays on the timeline (collapses
  the strip to that day) for URL-state parity.
- **My-vote chips** — multi-select of Must Go / Interested / Won't Go,
  using existing vote colors/icons, filtering by the current user's own
  votes. Nothing selected = off. Counted in the filter badge. Hidden when
  logged out. Schedule views only (not the Artists tab). **Confirmed as the
  standout feature during testing** — see verdicts below.

## Winning direction (what the PRD should describe)

A synthesis, not literally any single lettered prototype variant:

- **Navigation**: collapsed by default to a slim day-button strip + Now
  pill, with an explicit "Show overview" / "Hide overview" toggle that
  reveals a proportional mini-map (day boundaries, per-stage set density,
  voted sets colored by vote type, draggable viewport window,
  click-anywhere-to-jump). Smooth scroll on every jump (tested against an
  instant-jump alternative; smooth won clearly).
- **Filters**: day / time-of-day / stage in a bottom sheet, not an inline
  expanding panel — declutters the view. Kept **uniform on mobile and
  desktop** (no responsive divergence to a side-sheet on desktop) —
  untested against a second variant, but no complaints from testers and it
  halves the interaction patterns to validate. The Filters trigger sits
  inline in the same toolbar row as the nav controls, not on its own line
  (round-1 feedback: an icon-only button alone on a row wastes space).
- **My-vote chips**: Must Go / Interested / Won't Go multi-select,
  filtering the schedule to the viewer's own votes; nothing selected = off.
  Compact icon-only form in the map/nav header. This is the standout
  feature from testing — make sure the PRD gives it real estate, not an
  afterthought.
- **Day labels always carry the date** (`"Thu 13"`, not bare `"Thu"`) — a
  correctness fix, not a style choice: multi-weekend festivals
  (Tomorrowland is two long weekends) repeat weekday names, and a
  bare-weekday nav control can't disambiguate them.
- **Day filter + nav interaction (resolved directly with the product
  owner)**: when a day filter is active, the nav control shows **only that
  day's button** — i.e. nav reflects what's actually filtered, days don't
  stay visible-but-inert. This was the one open question from testing;
  explicitly decided, not tested with real users — flag as lower-confidence
  than the other decisions if revisited.

## Verdicts from testing (paraphrased; see the notes doc for fuller detail)

1. **URL-driven smooth jumping felt right.** No jank reported from the
   debounced `scrollTo` URL writes; a tester explicitly called the
   transition feel a "wow."
2. **Nav-vs-filter split read fine** for at least one tester (no one
   mistook a day button for a filter in practice).
3. **Vote-chip filtering is the standout.** One tester: it does something
   amazing, filters to exactly what you marked, "exactly what's needed."
   Confirms "my schedule" (Must Go + Interested) as the intended two-tap
   primary use case.
4. **Now-indicator treatment**: the chosen dashed-line style had no
   complaints; no strong signal either way beyond that.
5. Noise/clutter feedback (map always-visible, filter button alone on a
   row) is already folded into the winning direction above — resolved, no
   need to re-litigate.

## Related pre-existing issues to reconcile (found mid-session, not yet acted on)

- **#105** "Jump to current time in the Schedule timeline (scroll-to-now +
  shareable time links)" — `ready-for-human`, open. This is essentially the
  feature this whole effort builds. Decide: does the new PRD
  supersede/close #105, or does #105 get updated to link forward to the new
  issue?
- **#154** "fix: 'Jump to Today'/'Jump to Time' timeline buttons are
  no-ops" — the orphaned `TimelineControls.tsx`/`TimelineNavigation.tsx`
  stub files the original handoff already flagged for deletion. The real
  implementation should close this by replacing the stubs outright.
- **#176** "explore: give Timeline pixel geometry a single owner" and
  **#175** "explore: one Schedule pipeline behind List and Timeline views"
  — architecture explore tickets (`needs-triage`, from a 2026-07-13 review)
  that explicitly call out this feature as needing exactly the geometry/
  schedule-pipeline seams they propose. Worth a look before locking
  `/to-prd`'s "Implementation Decisions" seams — sequencing with either
  could change where this feature's code should live.

## Production code map (unchanged from the original handoff, still accurate)

- Timeline orchestrator + inline filtering:
  `src/pages/EditionView/tabs/ScheduleTab/horizontal/Timeline.tsx` (reveal
  gate — `canShowTime` — runs **before** anything else; do not bypass it —
  confirmed during prototyping that Tomorrowland's reveal level is already
  `full` so this was never actually the blocker it looked like it might be).
- Layout math (pure): `src/lib/timelineCalculator.ts` — 2px/minute,
  120px/hour, axis bounds derived from the *filtered* sets. `TimelineData`
  carries `festivalStart/festivalEnd`.
- Scroll surface: `.../horizontal/TimelineContainer.tsx`; sticky axis with
  floating day labels: `.../horizontal/TimeScale.tsx`.
- List view twin: `.../list/ListSchedule.tsx` (duplicate inline filter
  logic — see #175 above), filter UI: `.../ListFilters.tsx` (+
  `DayFilterSelect`, `TimeFilterSelect`, `StageFilterButtons`,
  `FilterContainer`).
- URL state: `timelineSearchSchema` in `src/lib/searchSchemas.ts` +
  `src/hooks/useTimelineUrlState.ts` (all updates `replace: true`).
- Votes: `src/lib/voteConfig.ts` (types/colors/values),
  `src/api/voting/useUserVotes.ts` (`Record<setId, vote_type>` for the
  current user).
- Set click-through: `.../horizontal/SetHeader.tsx` links to the set detail
  route.
- Timezone helpers: `src/lib/timeUtils.ts`.
- Router: `src/main.tsx` — no `scrollRestoration` configured; `scrollTo` in
  the URL is the restoration mechanism, confirmed working.

## Suggested skills for the next agent

- `/to-prd` — the core skill for this session. No interview needed; this
  doc + `HANDOFF_TIMELINE_NAV_PROTOTYPE_NOTES.md` are the synthesis inputs.
- `/codebase-design` — before locking implementation seams, worth a glance
  at #175/#176 above; they touch the exact same code this feature needs to
  modify.
- `/domain-modeling` — only if the PRD introduces vocabulary not already in
  `CONTEXT.md` (Vote, Set, Stage, Edition, Schedule, festival timezone
  already cover everything used so far).

## After the PRD

Publish with `ready-for-agent` (per `docs/agents/triage-labels.md`), then
delete the prototype code from PR #121 (deletion list in that branch's
`prototype/NOTES.md`) — the answer is the only thing worth keeping from a
prototype.

## Redactions

None needed — no secrets or PII.
