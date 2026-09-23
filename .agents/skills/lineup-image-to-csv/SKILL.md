---
name: lineup-image-to-csv
description: Convert a festival lineup poster/flyer image into a schedule-import CSV. Use when asked to turn a lineup poster image into a CSV, digitize a festival schedule graphic, or prepare an image for the schedule import wizard.
allowed-tools: Read, Write, Bash(uv venv .venv), Bash(uv pip install --python .venv/bin/python pillow), Bash(.venv/bin/python .agents/skills/lineup-image-to-csv/crop.py*)
---

# Lineup image to CSV

Turn a poster into a CSV matching [`docs/schedule-import.md`](../../../docs/schedule-import.md)'s columns and semantics — read that doc for the column contract, matching rules, and type semantics; this skill only covers the image-reading process, not the CSV format itself.

## 0. Identify the poster's format

Posters are not one shape. Read the full image (or, for a lineup split across several images, one representative image) before picking a flow:

- **Grid poster** — boxed rows against a shared time ruler, one or more stage columns. Go to _1. Set up cropping_. Example: a Boom-style stage/day timetable.
- **Text-list poster** — a day header followed by plain `time — title — artist` lines, no boxes or ruler. Often one image per stage. Skip cropping entirely: read times and titles directly off the full image (re-crop only if resolution is too low to read text). Go straight to _5. Compile the CSV_, applying the midnight rule (_4_) where a day's lines cross `00:00`. Example: `ownspirit/*.jpeg`, one image per stage.
- **Name-only poster** — an artist list with no times or stages (e.g. a phase-announcement flyer). There is no schedule to extract. Leave `Stage`, `Date`, `Start Time`, `End Time` blank; only `Artists`, `Set Name`, `Type`, and `Description` apply. Capture groupings the poster itself marks — joint billings (`X | Y`), "2 sets", "Live", "B2B" — the same way step 5's multi-artist rule does. Example: `desert-base/2026/lineup-phase1.jpg`.

The rest of this skill (steps 1-4) applies only to grid posters.

## 1. Set up cropping

The Read tool shows the whole image but can't crop, and a full poster is too low-resolution to resolve individual grid lines. Before reading times, set up the venv `crop.py` runs in:

```
uv venv .venv
uv pip install --python .venv/bin/python pillow
```

Do this in your scratchpad directory, not the repo. Crop with `.agents/skills/lineup-image-to-csv/crop.py` (run via `.venv/bin/python`) rather than ad hoc Pillow snippets — its `--box`/`--scale`/`--out` args cover every crop this skill needs; see its docstring for usage.

## 2. Map the grid once

Read the full image first for an overview: stage names (poster columns), the days covered, and roughly where each act sits. Then find the exact x-ranges of the ruler column(s) and each stage column by cropping the header strip (where stage-name bands meet the ruler) and reading pixel offsets off the crop's reported scale factor.

Composite a ruler + stage-column crop (`crop.py --box <ruler-box> --box <stage-box>` pastes them side by side) before reading times — reading a stage column in isolation gives you box edges with no times to anchor them to.

## 3. Read times by border, not by label

**A box's border is its boundary**: a set's top border sits exactly on the gridline of its start time; its bottom border sits exactly on the gridline of its end time. The time label printed next to a row is that row's _start_ — never eyeball which label a box's text looks centered on, always find the row line the border itself touches.

Crop each stage (with its ruler) in overlapping chunks tall enough to show ~8-12 rows, with `--scale 5` to `--scale 8` — that's the zoom level where a border-to-label read is unambiguous. Move top to bottom through the full poster; re-crop tighter around any boundary that lands ambiguously between two labels in a first pass.

Do not try to locate borders by scanning pixel colors along a fixed x/y line — text glyphs produce the same light pixels as border strokes and give false positives. Visual crop-and-read is slower but is the only reliable method.

## 4. Apply the midnight rule

The date rail (e.g. "24.9 THURSDAY") flips to the next calendar date exactly at the `00:00` gridline, regardless of how late the festival's evening "feels" like it's still going. A set starting at `23:00` and ending at `01:00` keeps the _start_ row's date — the import pipeline's own end-before-start rollover (see `docs/schedule-import.md`) advances the end date automatically, so don't do it yourself in the CSV.

Confirm this against the poster itself (crop the date-rail text column near a day transition) rather than assuming — don't extrapolate from one confirmed transition to the rest of the poster without a spot-check, since posters are hand-laid and can be inconsistent.

## 5. Compile the CSV

One row per act (a grid box, a text-list line, or a name in a name-only lineup). Column contract is in `docs/schedule-import.md`; the image-reading-specific parts:

- **Multi-artist billing** (`X ft. Y`, `X B2B Y`, `X & Y`, `X | Y`): split into pipe-separated `Artists`, and keep the poster's exact original billing text as `Set Name`.
- **Subtitles** under a title (Live, Downtempo, a remix note, Opening Ceremony) go in `Description`.
- **Stage** column is the poster's stage header text verbatim (don't abbreviate or normalize it — fuzzy stage matching happens at import time, not here). Blank on a name-only lineup.
- Save the CSV alongside the source image, same base name (`festivals/<name>.jpg` → `festivals/<name>.csv`).

## Done when

- **Grid poster**: every act on every stage and day has a start and end time each confirmed by a border read (not inferred from a neighboring act's spacing or pattern).
- **Text-list poster**: every line under every day header on every stage image has a row, in the order it appears.
- **Name-only poster**: every name on the poster has a row.
- Every multi-artist row has both a split `Artists` field and a `Set Name`.

Before importing: dry-run the CSV through the schedule import wizard and check the diff review step — stage names fuzzy-match against existing DB stages, and a near-miss surfaces there, not here.
