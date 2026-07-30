# Festival phase is derived, not stored

An edition moves through four ordered phases — **Pre-Schedule → Planning → Live → Post-Festival** — that gate which features the app surfaces. We derive the current phase from signals the platform already has (`schedule_reveal_level`, `start_date`, `end_date`, festival `timezone`) via a pure `getFestivalPhase({ revealLevel, startDate, endDate, timezone, now })`, rather than storing a `phase` column and advancing it. `now` is injected so the rule is a pure function; a thin `useFestivalPhase` hook calls it with the current time from the edition context. This builds on ADR-0001 (`schedule_reveal_level`) and ADR-0002 (festival-timezone display).

Derivation rules:

- `draft` reveal level ⇒ **Pre-Schedule**, regardless of dates. The schedule doesn't exist yet, so date-driven phases don't apply.
- Otherwise, `liveStart = start_date − 1 day @ 00:00` and `liveEnd = end_date + 1 day @ 06:00`, both evaluated **in the festival timezone**:
  - `now < liveStart` ⇒ **Planning**
  - `liveStart ≤ now ≤ liveEnd` ⇒ **Live** (boundaries inclusive)
  - `now > liveEnd` ⇒ **Post-Festival**
- The grace boundaries (`−1 day @ 00:00`, `+1 day @ 06:00`) keep an edition "Live" across arrival-day setup and the post-midnight tail of the final night, so a 02:00 closing set still reads as Live.
- NULL-date degradation: NULL `start_date` ⇒ never past **Planning** (no anchor to enter Live); NULL `end_date` ⇒ Live never flips to **Post** (no anchor to leave Live).

All calendar boundaries reuse the existing `fromZonedTime`-based helper (`convertLocalTimeToUTC`) in `src/lib/timeUtils.ts` — there is no second timezone approach. The seam mirrors the pure-lib + thin-hook split of ADR-0001's `scheduleReveal.ts` / `useScheduleReveal.ts`.

## Considered Options

- **Derive from existing signals (chosen).** No migration, no state machine to advance, no risk of a stored phase drifting out of sync with the dates/reveal level it should reflect. The phase is always a pure function of current facts + `now`.
- **Stored `phase` column on `festival_editions`.** Rejected: requires a migration and a mechanism to advance it (cron, admin action, or a trigger on `now`), and introduces a class of "phase says Live but the festival ended last week" bugs. Nothing needs to _remember_ a phase that the dates already imply.
- **`schedule_release_date` column.** Rejected: adds a third date field that overlaps with `start_date`/`schedule_reveal_level` and must be kept consistent with them. Reveal level already models schedule readiness; a separate release date is redundant state.

## Consequences

- The phase updates purely with the passage of time and edits to the dates/reveal level — no write path, no backfill. Editing `start_date` or bumping the reveal level immediately re-derives the phase.
- Because `now` is injected, the rule is unit-tested with no clock, DOM, or React mocking: tests assert only the phase output for a given `now`, not the internal boundary instants.
- Every downstream festival-phase ticket reads this one seam (`getFestivalPhase` / `useFestivalPhase`) instead of re-deriving boundaries, so the grace rules live in exactly one place.
- Consumers rendering across the exact boundary must pass a fresh `now` to re-derive; the hook reads `new Date()` per render and does not schedule a re-render at the boundary. A live-updating timer is out of scope for this slice.
