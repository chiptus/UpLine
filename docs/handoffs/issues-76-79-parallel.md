# Handoff — implement #76–#79 in parallel (festival-timezone widenings)

Foundation issue **#75** is merged (**PR #87**, on `main`). It added `festivals.timezone`, the admin picker, the pure `timeUtils` helpers + tests, the Schedule **list view** in festival time, and the header badge. Issues **#76, #77, #78, #79** each independently widen that foundation and can be built **in parallel by separate processes**.

Read the GitHub issue for authoritative scope/acceptance criteria. This doc adds only the concrete merged-API facts and coordination rules a parallel worker needs.

- Parent PRD: https://github.com/chiptus/UpLine/issues/74
- ADR: `docs/adr/0002-festival-timezone-display.md` · Glossary: `CONTEXT.md` ("Festival timezone")

## Rules for every parallel worker

1. **Branch from latest `main`** (it contains #87). Do NOT branch from `claude/schedule-festival-timezone-uf6mdj` (that was the pre-merge branch; it's superseded). Use one branch per issue, e.g. `claude/schedule-tz-timeline-76`, `-rest-of-app-77`, `-admin-editing-78`, `-csv-import-79`.
2. **Stay in your issue's lane** (file map below). The lanes were chosen so the four barely overlap.
3. **The one shared file is `src/lib/timeUtils.ts`, and only #77 edits it** (adds a `timezone` param to `formatTimeRange`). #76/#78/#79 only *read* existing helpers — do not modify `timeUtils.ts`. If you're #76/#78/#79 and think you need to change `timeUtils`, stop and coordinate — you probably don't.
4. **Never** run `supabase db push` / `db reset`, and **never** start a dev server (one runs on :8080 per CLAUDE.md). No schema changes are needed in any of these four — the column already exists.
5. Get `festival.timezone` from `useFestivalEdition()` (`src/contexts/FestivalEditionContext.tsx`) — it exposes `festival`. Pass the timezone *down* into pure functions; keep tz logic out of components.
6. Auto-commit after implementing. Open a PR with **`/create-pr`** (skill added in #89) targeting `main`. Rebase on `main` before merge. The four PRs are independent and may merge in any order.

## Merged `timeUtils` API you build on (all in `src/lib/timeUtils.ts`)

- `formatDateTime(dateTime, use24Hour, timezone?)` — tz-aware ✅
- `formatTimeOnly(startTime, endTime, use24Hour, timezone?)` — tz-aware ✅
- `formatDayOnly(dateTime, timezone?)` — tz-aware ✅
- `formatTimeRange(startTime, endTime, use24Hour)` — **NOT tz-aware yet** → #77 adds `timezone?` as the 4th param, mirroring the others.
- `getFestivalDayKey(dateTime, timezone?)` → `"yyyy-MM-dd"` in festival zone (post-midnight groups under festival day).
- `getFestivalDayLabel(dayKey)` → display label from a day key.
- `getFestivalHour(dateTime, timezone?)` → number 0–23 in festival zone (for morning/afternoon/evening + hour filters).
- `toDatetimeLocalInTimeZone(utcIso, timezone)` → `"yyyy-MM-dd'T'HH:mm"` for a datetime-local input, in festival zone (read side of admin editing).
- `convertLocalTimeToUTC(datetimeLocal, timezone)` → UTC ISO (write side of admin editing).
- `useScheduleData({ sets, stages, use24Hour, timezone })` — **options object**, returns `scheduleDays` grouped by festival `dayKey`.

---

## #76 — Horizontal timeline in festival time

**Lane (all under `src/pages/EditionView/tabs/ScheduleTab/horizontal/` + one lib file):**
- `Timeline.tsx` — already calls `useScheduleData({...})` but only reads `edition`. Add `festival` from `useFestivalEdition()` and pass `timezone: festival.timezone`. Its day filter uses `format(day.date, …)` and its time-of-day filter uses `set.startTime.getHours()` → switch to `getFestivalHour(..., festival.timezone)` and compare against the `dayKey` the hook now produces.
- `TimeScale.tsx` — hour markers use `format(timeSlot, "HH:mm")` and day-change detection uses `format(…, "yyyy-MM-dd")`, both browser-local. Render these in `festival.timezone` (thread the tz in as a prop).
- `TimeDisplay.tsx` — `formatCompactTime` uses raw `format(startTime, "H")`; the non-compact path calls `formatTimeOnly(start, end, true)`. Pass `festival.timezone` to `formatTimeOnly` and make the compact path festival-tz (use `getFestivalHour`/`formatInTimeZone`).
- `SetBlock.tsx` — just forwards to `TimeDisplay`; thread tz through.
- `src/lib/timelineCalculator.ts` — set **positioning** uses absolute `getTime()`/`differenceInMinutes` → **leave tz-invariant**. Only day-boundary *labels* move to festival tz (coordinate label rendering with `TimeScale`).

**Do NOT touch** `timeUtils.ts`. Watch: positioning must not regress.

## #77 — Set times in festival time across the rest of the app

**Lane:**
- `src/lib/timeUtils.ts` — **add `timezone?` as the 4th param to `formatTimeRange`** (when supplied, format via `formatInTimeZone`; existing callers unaffected). Add a unit test mirroring the others. **This is the only cross-cutting edit of the four — you own it.**
- `src/pages/SetDetails/SetInfoCard.tsx` and `MultiArtistSetInfoCard.tsx` — pass `festival.timezone` to `formatTimeRange` and the existing `formatDayOnly`.
- `src/pages/EditionView/tabs/ArtistsTab/SetCard/SetMetadata.tsx` — same.
- `src/pages/admin/festivals/SetsTable.tsx` — same.
- Reveal-level masking (day-only vs full) is unchanged — only the zone the visible time renders in changes.

## #78 — Admin set-time editing in festival time

**Lane:** `src/pages/admin/festivals/SetFormDialog.tsx` (react-hook-form based).
- Add `useFestivalEdition()` to get `festival.timezone`.
- Reads (pre-fill): replace `toDatetimeLocal(editingSet.time_start)` with `toDatetimeLocalInTimeZone(editingSet.time_start, festival.timezone)` (both start and end).
- Writes (submit): replace `toISOString(data.time_start)` with `convertLocalTimeToUTC(data.time_start, festival.timezone)` (both start and end).
- Add a visible label near the inputs (e.g. "Times in {festival.timezone}").
- Verify round-trip: enter 18:00 → displays 18:00 on the Schedule regardless of the admin's device zone.

**Do NOT touch** `timeUtils.ts` — `toDatetimeLocalInTimeZone` and `convertLocalTimeToUTC` already exist.

## #79 — CSV import defaults to festival timezone

**Lane:** the schedule-import wizard under `src/components/Admin/ScheduleImport/` (entry `ScheduleImportWizard.tsx` / `CsvUploadStep.tsx`, which currently hardcodes `"Europe/Lisbon"`).
- Pre-select the picker's initial value with the parent festival's `timezone` instead of the hardcoded default.
- Keep the picker overridable per import; the diff/commit pipeline that parses CSV local times → UTC is unchanged.

**Do NOT touch** `timeUtils.ts`.

## Suggested skills (each worker)

- `/tdd` — for #77's `formatTimeRange` timezone param (unit test in `src/lib/timeUtils.test.ts`). #76/#78/#79 are wiring over already-tested helpers; add tests only if you introduce new pure logic.
- `/verify` — drive the actual UI surface for your issue (timeline hour labels / set-detail page / admin form round-trip / import picker default). Don't rely on types alone.
- `/code-review` or `/simplify` before committing.
- `/create-pr` to open the PR against `main`.

## Conflict summary (why this is safe to parallelize)

| Issue | Files | Touches `timeUtils.ts`? |
|-------|-------|--------------------------|
| #76 | `horizontal/*`, `timelineCalculator.ts` | read-only |
| #77 | `SetDetails/*`, `SetCard/SetMetadata.tsx`, admin `SetsTable.tsx`, **`timeUtils.ts`** | **edits** (adds `formatTimeRange` tz param) |
| #78 | admin `SetFormDialog.tsx` | read-only |
| #79 | `Admin/ScheduleImport/*` | read-only |

No two issues edit the same file except `timeUtils.ts`, which only #77 modifies (additively). Rebase on `main` before each merge.
