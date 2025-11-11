import type { ImportCandidate } from "./conflictDetector";

export interface StageImportData {
  name: string;
}

export interface SetImportData {
  name?: string;
  stage_name: string;
  artist_names: string;
  time_start?: string;
  date_start?: string;
  time_end?: string;
  date_end?: string;
  description?: string;
}

export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split("\n");
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result.map((field) => field.replace(/^"|"$/g, ""));
  });
}

export function parseStagesCSV(csvContent: string): StageImportData[] {
  const lines = parseCSV(csvContent);
  const headers = lines[0] as Array<keyof StageImportData>;

  return lines.slice(1).map((line) => {
    const stage: Partial<StageImportData> = {};
    headers.forEach((header, index) => {
      stage[header] = line[index] || "";
    });
    return stage as StageImportData;
  });
}

export function parseSetsCSV(csvContent: string): SetImportData[] {
  const lines = parseCSV(csvContent);
  const headers = lines[0];

  return lines.slice(1).map((line) => {
    const set: Partial<SetImportData> = {};
    headers.forEach((header, index) => {
      const value = line[index] || "";
      if (
        header === "time_start" ||
        header === "time_end" ||
        header === "date_start" ||
        header === "date_end"
      ) {
        set[header as keyof SetImportData] = value || undefined;
      } else if (header === "name") {
        set[header as keyof SetImportData] = value || undefined;
      } else {
        set[header as keyof SetImportData] = value;
      }
    });
    return set as SetImportData;
  });
}

// Extract artist candidates from CSV sets data
export function extractArtistCandidatesFromSets(
  sets: SetImportData[],
): ImportCandidate[] {
  const artistMap = new Map<string, ImportCandidate>();

  for (const set of sets) {
    const artistNames = set.artist_names
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    for (const artistName of artistNames) {
      if (!artistMap.has(artistName)) {
        artistMap.set(artistName, {
          name: artistName,
          // CSV imports typically don't have additional metadata
          // but we could extract it from description or other fields if needed
        });
      }
    }
  }

  return Array.from(artistMap.values());
}
