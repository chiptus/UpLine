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

  return parsed.data
    .map((row) => {
      const artists = dedupeArtists(
        (row.artists ?? "")
          .split("|")
          .map((a) => a.trim())
          .filter(Boolean),
      );

      return {
        artists,
        setName: row["set name"]?.trim() || undefined,
        stage: row.stage?.trim() || undefined,
        date: row.date?.trim() || undefined,
        startTime: row["start time"]?.trim() || undefined,
        endTime: row["end time"]?.trim() || undefined,
        description: row.description?.trim() || undefined,
      };
    })
    .filter((row) => row.artists.length > 0);
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
