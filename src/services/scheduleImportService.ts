import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

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
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  // "Delimiter" errors are benign (a single-column CSV has no delimiter to
  // auto-detect); quote/field-count errors mean genuinely corrupted rows.
  const fatalErrors = parsed.errors.filter((e) => e.type !== "Delimiter");
  if (fatalErrors.length > 0) {
    const first = fatalErrors[0];
    const where = first.row != null ? ` (row ${first.row + 1})` : "";
    throw new Error(`Could not parse CSV${where}: ${first.message}`);
  }

  return parsed.data
    .map((row) => {
      const artists = (row.artists ?? "")
        .split("|")
        .map((a) => a.trim())
        .filter(Boolean);

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
