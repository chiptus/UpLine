import Papa from "papaparse";
import { type CsvRow } from "./types";

export function parseScheduleCsv(csvContent: string): CsvRow[] {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    const where = first.row != null ? ` (row ${first.row + 1})` : "";
    throw new Error(`Could not parse CSV${where}: ${first.message}`);
  }

  const rows = parsed.data
    .map((row) => {
      const artists = dedupeArtists(
        (row.artists ?? "")
          .split("|")
          .map((a) => a.trim())
          .filter(Boolean),
      );

      const setName = row["set name"]?.trim() || undefined;
      const stage = row.stage?.trim() || undefined;
      const date = row.date?.trim() || undefined;
      const startTime = row["start time"]?.trim() || undefined;
      const endTime = row["end time"]?.trim() || undefined;
      const description = row.description?.trim() || undefined;

      const csvRow: CsvRow = { artists };
      if (setName !== undefined) csvRow.setName = setName;
      if (stage !== undefined) csvRow.stage = stage;
      if (date !== undefined) csvRow.date = date;
      if (startTime !== undefined) csvRow.startTime = startTime;
      if (endTime !== undefined) csvRow.endTime = endTime;
      if (description !== undefined) csvRow.description = description;

      return csvRow;
    })
    .filter((row) => row.artists.length > 0);

  for (const row of rows) {
    for (const artist of row.artists) {
      if (!hasSluggableChars(artist)) {
        throw new Error(
          `Artist name "${artist}" has no letters or digits and can't be imported.`,
        );
      }
    }
    if (row.stage && !hasSluggableChars(row.stage)) {
      throw new Error(
        `Stage name "${row.stage}" has no letters or digits and can't be imported.`,
      );
    }
  }

  return rows;
}

// A name with no [a-z0-9] slugifies to an empty string, which downstream
// breaks slug-based lookups and the slug unique constraints. Reject it here
// with a clear message instead of failing opaquely at commit time.
function hasSluggableChars(value: string): boolean {
  return /[a-z0-9]/i.test(value);
}

// A B2B cell like "Carl Cox | Carl Cox" must not list the same artist twice:
// duplicates change the diff's roster key and send duplicate slugs downstream.
function dedupeArtists(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
