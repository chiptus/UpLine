# Schedule import: how it works

The schedule import wizard (`Admin → Schedule import`) takes a CSV and turns it
into creates/updates/archives of an edition's sets. This doc explains the
pipeline end-to-end, the matching rules, and what adding a new CSV column costs.

## The pipeline, end to end

```
CSV file
  │  parseScheduleCsv (client)          src/services/scheduleImport/parseCsv.ts
  ▼
CsvRow[]  — parsed, validated rows
  │  diff-schedule (edge function)      supabase/functions/diff-schedule/
  ▼
DiffResult — creates / updates / orphans / conflicts
  │  DiffReviewStep (client UI)         src/components/Admin/ScheduleImport/
  │  user resolves stage mismatches and orphan handling
  ▼
CommitPayload
  │  buildCommitPayload (client)  →  commit-schedule (edge function)
  ▼
commit_schedule RPC (Postgres)          supabase/migrations/…commit_schedule…
```

1. **Parse (client).** `parseScheduleCsv` reads the CSV with papaparse.
   Recognized columns: `Artists` (pipe-separated for B2B), `Set Name`, `Stage`,
   `Date`, `Start Time`, `End Time`, `Description`, `Type`. Rows with neither
   artists nor a set name are discarded. Validation (unknown `Type` values,
   un-sluggable names) runs only on rows that survive the discard filter.
2. **Diff (edge).** `diff-schedule` loads the edition's current sets, stages,
   and artists, then walks the CSV rows through `computeDiff`. Each row either
   matches an existing set (→ update) or doesn't (→ create). DB sets no CSV row
   matched become _orphans_ (the user chooses archive/keep). Stage names that
   only fuzzy-match a DB stage become _mismatches_ for the user to resolve.
3. **Review (client).** The diff is shown before anything is written: summary
   counts, new artists, typed-set chips (stored → incoming), orphans, and stage
   mismatches.
4. **Commit.** The confirmed operations go through `commit-schedule` into the
   `commit_schedule` RPC, which applies everything in one transaction.

## Matching rules: which DB set does a row update?

Matching is the heart of the diff and the only genuinely subtle part. There are
two modes, chosen by whether the row has artists (see ADR-0008):

**Roster rows (has artists) — fuzzy.** Identity is the _artist roster_: rows
and sets are keyed by their sorted artist slugs, so "Carl Cox" finds the Carl
Cox set no matter how the name is spelled. Stage and date are only
_tie-breakers_ when several sets share a roster (narrow by stage, then by date
within the stage matches; a tie-breaker matching nothing is skipped rather than
emptying the pool). A roster row whose stage or date changed still matches —
that's an update, not a new set.

**Artist-less rows (no artists) — strict.** Identity is the _name_ (trimmed,
case-insensitive), which is weak — "Fire Show" can legitimately exist twice on
different days. So a supplied stage or date must actually hold: a candidate
whose stored stage or date contradicts the row is excluded outright, and if
nothing survives the row becomes a create. Candidates with _no_ stored
time/stage still match, so re-importing a time-less row doesn't duplicate it.
A CSV stage that is _new_ excludes every staged candidate; a _fuzzy-matched_
stage provisionally stands in for its closest DB stage (known limitation:
issue #447).

The two index spaces never cross: a roster row can't match a 0-artist set and
vice versa. Within one import, each DB set is matched at most once.

Boundary consequences (all deliberate, see ADR-0008): a roster _change_ is a
new identity — "Carl Cox" becoming "Carl Cox | Peggy Gou" creates a new set
and orphans the solo one, votes don't carry; renaming an artist-less set must
happen in the app, not the CSV (a CSV rename is create + orphan); crediting a
performer to a formerly artist-less set (or removing the last artist) also
changes identity. The orphan review is the safety net in every case.

A CSV import is a **full snapshot** of the schedule, never a partial add: any
DB set absent from the CSV is surfaced as an orphan and you choose archive or
keep, one by one.

## Type semantics

- `Type` blank or column absent → `null`; invalid value → parse error.
- On commit, an explicit type overwrites the stored one; `null` preserves it
  (`COALESCE` in the RPC). Consequence: an import can never clear a type back
  to `null`.

## Adding a new CSV column: the checklist

A plain passthrough column (parsed, carried, written — no matching semantics)
is mechanical. It touches the contract in seven places; missing the client Zod
schema is the classic mistake (non-strict `z.object` silently strips unknown
keys):

1. `src/services/scheduleImport/parseCsv.ts` — parse + validate (+ tests)
2. `src/services/scheduleImport/types.ts` — `CsvRow` + `setPayloadSchema`
   (+ `diffResultSchema` if the diff returns it)
3. `supabase/functions/diff-schedule/types.ts` — `CsvRow`, `SetPayload`,
   `DbSet` if read back
4. `supabase/functions/diff-schedule/index.ts` — request schema + DB select
5. `supabase/functions/diff-schedule/computeDiff.ts` — into the payload
6. `supabase/functions/commit-schedule/index.ts` — payload schema
7. `supabase/migrations/` — new migration redefining the `commit_schedule__*`
   helpers that write the column
   (+ UI in `src/components/Admin/ScheduleImport/` if it should be visible)

Issue #448 tracks collapsing the duplicated halves of this contract so the
list gets shorter.

A column that participates in _identity_ (affects which set a row matches) or
has overwrite/preserve semantics is a different kind of change: it lands in
`resolvers.ts`/`computeDiff.ts` and needs the same red-green treatment the
artist-less matching got. Budget accordingly.
