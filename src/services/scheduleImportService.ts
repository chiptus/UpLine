import { supabase } from "@/integrations/supabase/client";

function parseCSV(csvContent: string): string[][] {
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

export type CsvRow = {
  artists: string[];
  setName?: string;
  stage?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
};

export type SetPayload = {
  name: string;
  description: string | null;
  stageName: string | null;
  timeStart: string | null;
  timeEnd: string | null;
  artistSlugs: string[];
};

export type DiffResult = {
  summary: {
    newArtists: number;
    newStages: number;
    setsMatched: number;
    setsToCreate: number;
    setsOrphaned: number;
  };
  newArtistNames: string[];
  cleanOperations: {
    artistsToCreate: { name: string; slug: string }[];
    stagesToCreate: { name: string }[];
    setsToCreate: SetPayload[];
    setsToUpdate: ({ id: string } & SetPayload)[];
  };
  conflicts: {
    stageNameMismatches: {
      csvValue: string;
      closestDbValue: string;
      dbStageId: string;
    }[];
    orphanedSets: {
      id: string;
      name: string;
      stage: string | null;
      timeStart: string | null;
    }[];
  };
};

export type CommitResult = {
  setsCreated: number;
  setsUpdated: number;
  setsArchived: number;
};

export type StageMismatchResolution =
  | { action: "map"; dbStageName: string }
  | { action: "create" };

export type OrphanResolution = "archive" | "keep";

export function parseScheduleCsv(csvContent: string): CsvRow[] {
  const lines = parseCSV(csvContent);
  if (lines.length < 2) return [];

  const headers = lines[0].map((h) => h.trim().toLowerCase());

  function col(name: string) {
    return headers.indexOf(name);
  }
  const artistsCol = col("artists");
  const setNameCol = col("set name");
  const stageCol = col("stage");
  const dateCol = col("date");
  const startTimeCol = col("start time");
  const endTimeCol = col("end time");
  const descriptionCol = col("description");

  return lines
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => {
      const artistsRaw = artistsCol >= 0 ? (row[artistsCol] ?? "") : "";
      const artists = artistsRaw
        .split("|")
        .map((a) => a.trim())
        .filter(Boolean);

      return {
        artists,
        setName:
          setNameCol >= 0 ? row[setNameCol]?.trim() || undefined : undefined,
        stage: stageCol >= 0 ? row[stageCol]?.trim() || undefined : undefined,
        date: dateCol >= 0 ? row[dateCol]?.trim() || undefined : undefined,
        startTime:
          startTimeCol >= 0
            ? row[startTimeCol]?.trim() || undefined
            : undefined,
        endTime:
          endTimeCol >= 0 ? row[endTimeCol]?.trim() || undefined : undefined,
        description:
          descriptionCol >= 0
            ? row[descriptionCol]?.trim() || undefined
            : undefined,
      };
    })
    .filter((row) => row.artists.length > 0);
}

export async function callDiffSchedule(
  festivalEditionId: string,
  timezone: string,
  rows: CsvRow[],
): Promise<DiffResult> {
  const { data, error } = await supabase.functions.invoke("diff-schedule", {
    body: { festivalEditionId, timezone, rows },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as DiffResult;
}

export function buildCommitPayload(
  diff: DiffResult,
  stageMismatchResolutions: Record<string, StageMismatchResolution>,
  orphanResolutions: Record<string, OrphanResolution>,
): {
  artistsToCreate: { name: string; slug: string }[];
  stagesToCreate: { name: string }[];
  setsToCreate: SetPayload[];
  setsToUpdate: ({ id: string } & SetPayload)[];
  setIdsToArchive: string[];
} {
  const mismatchedCsvValues = new Set(
    diff.conflicts.stageNameMismatches.map((m) => m.csvValue),
  );

  function resolveSetStageName(set: SetPayload): string | null {
    if (!set.stageName) return null;
    if (!mismatchedCsvValues.has(set.stageName)) return set.stageName;
    const resolution = stageMismatchResolutions[set.stageName];
    if (!resolution) return set.stageName;
    return resolution.action === "map" ? resolution.dbStageName : set.stageName;
  }

  const extraStagesToCreate: { name: string }[] = [];
  for (const mismatch of diff.conflicts.stageNameMismatches) {
    const resolution = stageMismatchResolutions[mismatch.csvValue];
    if (resolution?.action === "create") {
      extraStagesToCreate.push({ name: mismatch.csvValue });
    }
  }

  const setIdsToArchive = diff.conflicts.orphanedSets
    .filter((s) => (orphanResolutions[s.id] ?? "keep") === "archive")
    .map((s) => s.id);

  return {
    artistsToCreate: diff.cleanOperations.artistsToCreate,
    stagesToCreate: [
      ...diff.cleanOperations.stagesToCreate,
      ...extraStagesToCreate,
    ],
    setsToCreate: diff.cleanOperations.setsToCreate.map((s) => ({
      ...s,
      stageName: resolveSetStageName(s),
    })),
    setsToUpdate: diff.cleanOperations.setsToUpdate.map((s) => ({
      ...s,
      stageName: resolveSetStageName(s),
    })),
    setIdsToArchive,
  };
}

export async function callCommitSchedule(
  festivalEditionId: string,
  payload: ReturnType<typeof buildCommitPayload>,
): Promise<CommitResult> {
  const { data, error } = await supabase.functions.invoke("commit-schedule", {
    body: { festivalEditionId, ...payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as CommitResult;
}
