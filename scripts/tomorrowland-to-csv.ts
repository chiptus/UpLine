#!/usr/bin/env tsx
// Converts the Tomorrowland lineup dump (tomorrowland.ts) into the CSV format
// expected by the schedule importer (src/services/scheduleImport/parseCsv.ts).
//
// Importer columns (case-insensitive headers):
//   Artists (| separated) | Set Name | Stage | Date (YYYY-MM-DD) |
//   Start Time (HH:MM) | End Time (HH:MM) | Description
//
// Usage:
//   pnpm tsx scripts/tomorrowland-to-csv.ts [input.ts] [output.csv] [--include-mtba]
//   pnpm tsx scripts/tomorrowland-to-csv.ts > schedule.csv   (defaults, stdout)

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Artist = { id?: string; name?: string; image?: string };
type Performance = {
  id?: string;
  name?: string;
  artists?: Artist[];
  stage?: { id?: string; name?: string };
  date?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
};

type Row = {
  artists: string;
  setName: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
};

const MTBA = "more to be announced";

const args = process.argv.slice(2);
const includeMtba = args.includes("--include-mtba");
const positional = args.filter((a) => !a.startsWith("--"));

const inputPath = resolve(positional[0] ?? "tomorrowland.ts");
const outputPath = positional[1] ?? null; // null => stdout

const performances = loadPerformances(inputPath);

const rows: Row[] = [];
for (const p of performances) {
  const artistNames = dedupe(
    (p.artists ?? []).map((a) => (a.name ?? "").trim()).filter(Boolean),
  );
  if (artistNames.length === 0) continue;

  const isMtba =
    artistNames.every((n) => n.toLowerCase() === MTBA) ||
    (p.name ?? "").trim().toLowerCase() === MTBA;
  if (isMtba && !includeMtba) continue;

  rows.push({
    artists: artistNames.join(" | "),
    setName: (p.name ?? "").trim(),
    stage: (p.stage?.name ?? "").trim(),
    date: (p.date ?? "").trim(),
    startTime: toHHMM(p.startTime),
    endTime: toHHMM(p.endTime),
    description: "",
  });
}

// Stable ordering: date, then start time, then stage — nicer to diff/review.
rows.sort(
  (a, b) =>
    a.date.localeCompare(b.date) ||
    a.startTime.localeCompare(b.startTime) ||
    a.stage.localeCompare(b.stage),
);

const header = [
  "Artists",
  "Set Name",
  "Stage",
  "Date",
  "Start Time",
  "End Time",
  "Description",
];
const lines = [header.join(",")];
for (const r of rows) {
  lines.push(
    [
      r.artists,
      r.setName,
      r.stage,
      r.date,
      r.startTime,
      r.endTime,
      r.description,
    ]
      .map(csvField)
      .join(","),
  );
}
const csv = lines.join("\n") + "\n";

if (outputPath) {
  writeFileSync(resolve(outputPath), csv);
  process.stderr.write(`Wrote ${rows.length} sets to ${outputPath}\n`);
} else {
  process.stdout.write(csv);
  process.stderr.write(`Wrote ${rows.length} sets\n`);
}

// The dump is plain-JS object literals with no exports, so evaluate it and pull
// the arrays back out. (No TS-only syntax lives in the data section.)
function loadPerformances(path: string): Performance[] {
  const source = readFileSync(path, "utf8");
  const evaluate = new Function(
    `${source}\nreturn { performance1, performance2 };`,
  ) as () => { performance1?: Performance[]; performance2?: Performance[] };
  const { performance1 = [], performance2 = [] } = evaluate();
  return [...performance1, ...performance2];
}

// "2026-07-19 00:00:00+02:00" -> "00:00". Importer only stores HH:MM.
function toHHMM(value: string | undefined): string {
  if (!value) return "";
  const match = String(value).match(/\b(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function dedupe(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter((n) => {
    const key = n.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Quote fields containing comma, quote, or newline; double embedded quotes.
function csvField(value: string): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
