# Handoff — Implement issue #75 (festival timezone: schema + admin config + Schedule list view)

## Mission

Implement **https://github.com/chiptus/UpLine/issues/75** — the foundational tracer-bullet slice of the festival-timezone feature. Read the issue for the authoritative scope and acceptance criteria; this doc only adds the concrete codebase map and gotchas that the issues deliberately omit (issues avoid file paths because they go stale).

## Context you should read first (don't duplicate — read the source)

- **Parent PRD**: https://github.com/chiptus/UpLine/issues/74 — problem, solution, all 20 user stories, testing decisions, out-of-scope.
- **This slice**: https://github.com/chiptus/UpLine/issues/75 — acceptance criteria live here.
- **Sibling slices** (blocked on #75, do NOT implement here): #76 horizontal timeline, #77 rest-of-app displays, #78 admin editing, #79 CSV import default.
- **ADR** `docs/adr/0002-festival-timezone-display.md` — why timezone lives on `festivals` (not edition), why `NOT NULL DEFAULT 'Europe/Lisbon'`, day-boundary decision. Respect it.
- **Glossary** `CONTEXT.md` — new **Festival timezone** term. Use this vocabulary in code/tests/commit.

## Branch & git state

- Work on branch **`claude/schedule-festival-timezone-uf6mdj`** (already checked out, pushed, tracks origin). It is rebased on latest `main` and already contains one commit: the CONTEXT.md glossary term + ADR 0002. Do NOT restart the branch.
- Auto-commit rule (CLAUDE.md): commit after implementing. Push with `git push -u origin <branch>` (retry with backoff on network errors only).
- Do NOT open a PR unless the user asks.

## Key decisions already locked (from the grilling session)

| Decision | Choice |
|---|---|
| Timezone storage | `festivals.timezone`, inherited by editions |
| Column | `text NOT NULL DEFAULT 'Europe/Lisbon'` |
| Highlight | ONE header badge on Schedule tab, always shown |
| Day grouping | festival-tz calendar day (midnight boundary) |
| Test seam | **single** lib seam — all tz logic as pure functions in `src/lib/timeUtils.ts` |

## Codebase map (the value-add — saves re-exploration)

**Stored data is already correct**: set times are UTC `timestamptz` on the `sets` table (`sets.time_start` / `time_end`). The bug is purely display: the schedule path calls plain date-fns `format()` on a `Date` built from the UTC string → renders in the browser zone.

**The seam** — `src/lib/timeUtils.ts` (tests in `src/lib/timeUtils.test.ts`):
- `formatDateTime(dateTime, use24Hour, timezone?)` — already has the optional `timezone` param using `formatInTimeZone`. The schedule just isn't passing it.
- `formatDayOnly(dateTime, timezone?)` — already tz-capable.
- `formatTimeRange(...)` — does NOT yet accept a timezone (needed by #77, but add param here if convenient; not required for #75).
- `toDatetimeLocal` / `toISOString` — hardcode the browser zone via `getUserTimeZone()`. Add festival-tz variants here (unit-tested now; consumed by #78).
- `convertLocalTimeToUTC(timeString, timezone)` already exists — reuse for the tz-aware `toISOString`.
- date-fns-tz helpers `formatInTimeZone`, `toZonedTime`, `fromZonedTime` are already imported. For "wall-clock parts in a zone" (hour / calendar-day for filters + grouping), `toZonedTime(utcDate, tz)` returns a Date whose local getters read as festival wall-clock — standard pattern.

**Where the festival timezone comes from**: `src/contexts/FestivalEditionContext.tsx` already exposes `festival` via `useFestivalEdition()`. After the schema change, `festival.timezone` is available anywhere in the Schedule tab. No new query needed.

**Schedule list view (this slice's display surface)**:
- `src/hooks/useScheduleData.ts` — line ~71 `formatDateTime(set.time_start, use24Hour)` called WITHOUT tz. Day grouping at ~84 uses `format(startOfDay(set.startTime), "yyyy-MM-dd")` and displayDate `format(date, "EEEE, MMM d")` — both browser-local. Add a `timezone` param to the hook and route these through the festival-tz day-key/day-label helper.
- `src/pages/EditionView/tabs/ScheduleTab/list/ListSchedule.tsx` — filters use `format(set.startTime, "yyyy-MM-dd")` (matchesDay) and `set.startTime.getHours()` (matchesTime) → convert to festival-tz wall-clock parts. Date header uses `isSameDay(slot.time, prevSlot.time)` → festival-tz.
- `src/pages/EditionView/tabs/ScheduleTab/list/TimeSlotGroup.tsx` — `format(timeSlot.time, "EEEE, MMMM d")` and `format(timeSlot.time, "HH:mm")` → festival-tz.
- `src/pages/EditionView/tabs/ScheduleTab/list/MobileSetCard.tsx` — `format(set.startTime, "HH:mm")` for start/end → festival-tz.
- Badge: add to `src/pages/EditionView/tabs/ScheduleTab.tsx` (has `useFestivalEdition()` already) or the list container.

**NOT in this slice** (leave for #76): `horizontal/TimeScale.tsx`, `horizontal/TimeDisplay.tsx`, `horizontal/SetBlock.tsx`, `src/lib/timelineCalculator.ts`, and `Timeline.tsx` filters. Note horizontal set POSITIONING uses absolute `getTime()` and must stay tz-invariant — only labels/filters change (in #76).

**Admin config UI**: `src/pages/admin/festivals/FestivalDialog.tsx` — festival create/edit form. Add the timezone field here.
- Reuse the existing picker: `src/components/Admin/ScheduleImport/TimezonePicker.tsx` — signature `{ value: string, onChange: (v: string) => void }`, renders its own "Timezone" label. Catalog: `timezoneCatalog.ts` in the same folder.
- ⚠️ `FestivalDialog` currently uses plain `useState`, NOT react-hook-form (a pre-existing deviation from the CLAUDE.md "all forms use react-hook-form" rule). Match the existing pattern in that file for a focused diff; don't refactor the whole dialog.

**API layer**:
- `src/api/festivals/types.ts` — `Festival = Database["public"]["Tables"]["festivals"]["Row"]` (auto-picks up `timezone` once types regenerated).
- `src/api/festivals/useCreateFestival.ts` and `useUpdateFestival.ts` — both have an inline `festivalData` shape literal (name/slug/description/published/logo_url). Add `timezone?: string` to both.

## Migration & types gotcha (IMPORTANT)

- CLAUDE.md forbids `supabase db push` and `supabase db reset`. Do NOT run them.
- Add a migration file under `supabase/migrations/` (follow the existing timestamp-prefixed naming; latest is `20260530000000_add_schedule_reveal_level.sql`). Content: the `ALTER TABLE festivals ADD COLUMN timezone text NOT NULL DEFAULT 'Europe/Lisbon';`.
- `src/integrations/supabase/types.ts` is generated but must be updated by hand here since you can't push. Add `timezone: string` to the `festivals` Row, and `timezone?: string` to Insert/Update. Find the `festivals` table block (around the `Tables.festivals` definition).

## Suggested skills (invoke these)

1. **`/tdd`** — primary. The single lib seam is ideal for red-green-refactor. Write `timeUtils` tests first: festival-time formatting (12h/24h, non-zero offset), day-key/day-label grouping (a 01:00-festival-time set groups under the festival day; a near-midnight set on the correct side; assert independent of machine TZ), datetime-local↔UTC festival round-trip, and a DST-boundary case. Prior art: `src/lib/timeUtils.test.ts`, `src/lib/scheduleReveal.test.ts`. Run with `pnpm test`.
2. **`/supabase`** — for authoring the migration correctly (but remember: never `db push`/`db reset` here).
3. **`/verify`** — after wiring, drive the actual Schedule list view to confirm times render in festival time (don't rely on unit tests alone for the UI wiring). Note: dev server is already running on :8080 per CLAUDE.md — do NOT start your own.
4. **`/code-review`** or **`/simplify`** — before committing.

## Definition of done for #75

All acceptance criteria in the issue checked. Concretely: migration + hand-updated types + create/update mutations carry `timezone`; FestivalDialog picker (default Lisbon); Schedule list view + grouping + filters + date headers in festival time; header badge; green `timeUtils` unit tests covering the four cases above. Then commit + push to the branch.

## Do NOT

- Implement #76–#79 (sibling slices) — this session is #75 only.
- Close/modify parent #74.
- Run `supabase db push` / `db reset` or start a dev server.
- Restart/force-reset the branch (it carries the docs commit + is based on latest main).
