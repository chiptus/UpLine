# Set times are displayed in a fixed festival timezone, not the viewer's

Set `time_start`/`time_end` are stored as UTC `timestamptz`, but were formatted with plain date-fns `format()`, which renders in the **viewer's browser timezone**. A festival-goer looking at a Portugal festival from another country saw times shifted by their own UTC offset. We now store a `timezone` (IANA name) on `festivals`, inherited by all its editions, and render every set time/day in that fixed zone so all viewers see the same wall-clock time. The Schedule tab carries a prominent badge stating which zone times are shown in.

## Considered Options

- **Timezone on `festivals` (chosen).** Set once per festival, inherited by editions. A festival's location rarely changes between editions, so one entry covers all of them.
- **Timezone on `festival_editions`.** Rejected: the schedule is edition-scoped, so this was the "natural" home, but it forces re-entry every edition for a value that almost never differs. A relocating/touring edition is rare enough to defer; if it ever matters, add a nullable per-edition override that falls back to the festival's.
- **Dedicated settings table.** Rejected: heaviest option (new table, RLS, admin UI) and doesn't scope naturally to "which festival am I viewing."
- **Keep rendering in the viewer's local zone.** Rejected — this is the bug.

## Consequences

- `festivals.timezone` is `NOT NULL DEFAULT 'Europe/Lisbon'` (the value the CSV import wizard already defaulted to). Every festival always has a concrete zone, so the display path never branches on "unset" — no viewer-local fallback anywhere.
- Display formatting routes through the existing `formatInTimeZone`-based helpers in `src/lib/timeUtils.ts` (which already accepted an optional `timezone`). Day-grouping in `useScheduleData` and the Schedule **list view** now compute in the festival zone, so a post-midnight set groups by the **festival** calendar day, not the viewer's. The horizontal timeline view (`TimeScale`, `TimeDisplay`, `SetBlock`) is intentionally out of scope for this slice and still renders in the viewer's local zone; that conversion is planned for #76.
- Post-midnight sets group by the festival's calendar-day boundary (midnight). A 01:00 set lands under the next day, not "the previous night." A custom per-festival day-start hour was considered and deferred as a separate feature.
- Admin set-time edit inputs (`datetime-local`) also operate in the festival zone with a visible label, so what an admin types matches what displays. This required festival-zone variants of `toDatetimeLocal`/`toISOString`, which previously hardcoded the browser zone.
- The CSV import wizard defaults its timezone picker to the festival's zone (still overridable per import), keeping import interpretation and display consistent by default.
