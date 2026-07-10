# Epic: Festival phases

> Labels: `ready-for-agent` (epic / tracking)
> Children: PR 1 — foundation + Pre-Schedule/Planning · PR 2 — Live · PR 3 — Post-Festival
> Builds on #46 (schedule reveal level, merged). Sibling of #47 (progressive Schedule-tab rendering).

This is the umbrella record for the festival-phases feature. It captures the
whole four-phase vision and every cross-phase decision locked in during the
design (grilling) session, so each child PRD can be implemented independently
**without re-running that session**. Read this first, then the relevant child PRD.

## Problem Statement

A festival edition means very different things to a user at different points in
its lifecycle, but UpLine presents the same UI throughout:

1. **Before the schedule is revealed** — the user only knows *some* of the artists
   who will play; not how many sets each plays, on which stage, or when. The app
   still leads with a "Vote" tab full of timeless sets, which reads as broken
   rather than "the schedule isn't out yet."
2. **After reveal, before the festival** — the user wants to plan which sets to
   attend and coordinate with their group. This is what the app is built around
   today.
3. **During the festival** — the user mostly wants the schedule: what's on now and
   next.
4. **After the festival** — the user wants to look back and record which sets they
   liked most.

The app has no concept of *where in this lifecycle an edition is*, so it can't
lead the user to the right thing at the right time.

## Solution

Introduce a **festival phase**: an ordered, **derived** lifecycle position for an
edition — **Pre-Schedule → Planning → Live → Post-Festival** — computed from
signals the platform already has. The phase drives *how the edition is framed and
where the user lands*, layered on top of (and orthogonal to) the existing
**schedule reveal level** and **edition published** flags.

The feature is delivered in three increments:

- **PR 1 — Foundation + Pre-Schedule/Planning.** The derivation core, the phase
  hook, the phase banner, phase-driven default tab + "Lineup"/"Vote" label. No
  schema change.
- **PR 2 — Live.** A "now / next"-oriented Schedule experience while the festival
  is happening. No schema change.
- **PR 3 — Post-Festival.** A **retrospective rating** axis (separate from Vote)
  for rating sets after the fact, plus the admin **phase override**. One
  migration.

## The four phases (shared contract)

Ordered lifecycle. Derivation is defined once here and consumed by all children.

| Phase | Meaning | Detection |
| --- | --- | --- |
| **Pre-Schedule** | Lineup known, schedule not revealed | `reveal_level === "draft"` |
| **Planning** | Schedule revealing, festival not yet on | `reveal_level !== "draft"` AND `now < liveStart` |
| **Live** | Festival is happening (incl. grace) | `liveStart <= now <= liveEnd` |
| **Post-Festival** | Festival over | `now > liveEnd` |

- All calendar boundaries are evaluated **in the festival timezone**
  (`festival.timezone`), never the viewer's zone.
- `liveStart` = `start_date − 1 day` at `00:00` festival-tz (early arrivers/campers
  see "happening," not "upcoming").
- `liveEnd` = `end_date + 1 day` at `06:00` festival-tz (covers after-midnight
  closing sets before flipping to Post-Festival).
- **NULL dates degrade gracefully:** no `start_date` ⇒ never past Planning; no
  `end_date` ⇒ Live never flips to Post on its own.
- **`draft` always wins:** an edition in `draft` is Pre-Schedule regardless of
  dates.
- In PR 3 an admin **phase override** can force a specific phase, taking
  precedence over the derived value (for delayed/cancelled festivals).

### Phase → UX contract

| | Default tab | Primary-tab label | Banner | Notable |
| --- | --- | --- | --- | --- |
| **Pre-Schedule** | primary (sets) | **"Lineup"** | "lineup live, schedule soon" | Voting enabled; Schedule tab shows reveal-level content (#47) or placeholder |
| **Planning** | primary (sets) | **"Vote"** | "schedule out — N days to go" | Full planning/voting UX (today's app) |
| **Live** | **Schedule** | "Vote" | "festival is on" (compact) | Schedule surfaces "now / next"; voting still available |
| **Post-Festival** | primary (sets) | "Vote" | "how were your sets?" | Primary tab enters **rating mode** (retrospective rating axis) |

- **Navigation stays stable across all phases** — no tab is shown or hidden by
  phase. Phase changes the *default landing tab*, *labels*, *banner*, and the
  primary tab's *mode*, never the tab set itself.

## Cross-phase decisions (locked)

These were resolved during the design session and apply across children:

1. **Derived, not stored.** Phase is computed from `schedule_reveal_level` +
   `start_date`/`end_date` + `festival.timezone`. Rejected a `schedule_release_date`
   column (festivals don't announce drop dates) and a stored `phase` column
   (redundant; would drift). Only PR 3 adds a column, and only for the *override*.
2. **Single derivation seam.** A pure `getFestivalPhase({ revealLevel, startDate,
   endDate, timezone, now })` function is the one place phase logic lives; a thin
   `useFestivalPhase` hook exposes it (mirrors `useScheduleReveal`). All phase
   consumers go through these. `now` is injected for testability.
3. **Pre-Schedule set model.** One set per artist during Pre-Schedule (times/stage
   masked by `draft`). When the schedule later reveals an artist across multiple
   sets, existing **votes copy to all** of that artist's new sets (preserves "I
   want to see this artist"; the user can then prune conflicts). *Implemented when
   the split workflow is built; specified here so it isn't re-litigated.*
4. **Retrospective rating is a separate axis from Vote.** Post-Festival "how was
   it" is **not** a Vote. Vote is anticipatory ("will I go"); rating is
   retrospective ("did I like it"). New `set_ratings` storage in PR 3, distinct
   from `votes`, so planning intent is never overwritten by a rating.
5. **Admin override is deferred to PR 3.** The pre→planning boundary is already
   admin-controlled (reveal level). A manual override for the calendar-driven
   boundaries (Live/Post) needs a column, so it lands with PR 3's migration.
6. **No live ticker.** Phase is computed per render from the current time —
   sufficient at day-granularity boundaries. No background timer in any PR.
7. **Compact banners.** The phase banner is one unobtrusive line. Broader
   header/banner de-clutter (a known pre-existing concern) is a separate effort,
   not part of this epic.

## Relationship to #47 (progressive Schedule-tab rendering)

Different axes, one shared signal:

- **Festival phase** = the edition's lifecycle position (this epic).
- **#47** = *what the Schedule tab renders* per `schedule_reveal_level`
  (day-grouped lineup at `days`, stage×day grid at `stages`).

They read the same reveal level and are consistent by construction: Pre-Schedule
is exactly `draft` (where #47 keeps the placeholder); Planning spans
`days`/`stages`/`full` (the levels #47 renders progressively). Neither blocks the
other. The one coordination point is **banner stacking**: in Planning at
`days`/`stages` a user could see both the phase banner (edition layout) and #47's
in-tab embargo line — kept manageable by both being single compact lines; whichever
lands second should sanity-check the combination.

## Domain vocabulary (added by this epic)

- **Festival phase** — ordered, *derived* lifecycle position of an edition
  (Pre-Schedule → Planning → Live → Post-Festival). Not a stored entity (parallel
  to how "Schedule" is defined as derived). Added to `CONTEXT.md` in PR 1.
- **Retrospective rating** — a user's after-the-fact reaction to a **set** they
  experienced ("how was it"), distinct from **Vote** (anticipatory). The glossary
  currently says Vote → *Avoid: Rating*; this is a genuinely new concept, not a
  synonym. Added to `CONTEXT.md` in PR 3, alongside its own ADR.

## ADRs (produced across the epic)

- **ADR-0003 — Festival phase is derived, not stored** (PR 1): the derivation
  rules, grace boundaries, NULL-date degradation, and rejected alternatives.
  Builds on ADR-0001 (reveal level) and ADR-0002 (timezone); no conflict.
- **ADR-0004 — Retrospective rating is separate from Vote** (PR 3): why post-
  festival rating is its own axis/storage rather than reusing or overwriting
  votes.

## Testing strategy (shared)

The high-value seam is the pure `getFestivalPhase` function (PR 1) — every
boundary/timezone/NULL-date case is unit-tested there with `now` injected, no
clock/DOM/React mocking. Prior art: `src/lib/timeUtils.test.ts` and the
`scheduleReveal` pattern. PR 2's "now / next" derivation (which sets are current
/ upcoming for a given `now`) is the next pure seam worth its own tests. PR 3's
rating mutation is tested at the data-access seam like the existing voting module.
Hooks and UI are thin pass-throughs and are not separately unit-tested.

## Out of scope (whole epic)

- Server-side reveal masking hardening (the `public_sets` view / revoked SELECT) —
  documented upgrade path in #46, not needed here.
- Per-day / per-stage reveal granularity — orthogonal to phase; not addressed.
- Header/banner visual de-clutter — separate effort.
- Any change to `full`-level Timeline/List rendering beyond what PR 2 adds for
  "now / next."

## Child PRDs

1. **PR 1 — Foundation + Pre-Schedule/Planning** — derivation core, hook, banner,
   default tab, "Lineup"/"Vote" label, ADR-0003, glossary. No migration.
2. **PR 2 — Live phase** — Schedule-first default, "now / next" surfacing,
   compact Live banner. No migration.
3. **PR 3 — Post-Festival phase** — retrospective rating axis (`set_ratings`),
   rating mode on the primary tab, admin phase override, ADR-0004, glossary. One
   migration.
