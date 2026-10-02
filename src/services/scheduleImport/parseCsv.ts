import Papa from "papaparse";
import { asSetType } from "@/api/sets/types";
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

      const csvRow: CsvRow = { artists, setType: null };
      if (setName !== undefined) csvRow.setName = setName;
      if (stage !== undefined) csvRow.stage = stage;
      if (date !== undefined) csvRow.date = date;
      if (startTime !== undefined) csvRow.startTime = startTime;
      if (endTime !== undefined) csvRow.endTime = endTime;
      if (description !== undefined) csvRow.description = description;

      return { csvRow, rawType: row.type };
    })
    .filter(
      ({ csvRow }) => csvRow.artists.length > 0 || csvRow.setName !== undefined,
    )
    // Validate the type only on rows that survive the filter, so a discarded
    // row (no artists, no set name) can't abort the import over a bad type.
    .map(({ csvRow, rawType }) => ({
      ...csvRow,
      setType: parseSetType(rawType),
    }));

  return rows;
}

function parseSetType(raw: string | undefined): CsvRow["setType"] {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  const setType = asSetType(value);
  if (setType === null) {
    throw new Error(
      `Invalid type "${raw?.trim()}" — use music, workshop, performance or other, or leave it blank.`,
    );
  }
  return setType;
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
