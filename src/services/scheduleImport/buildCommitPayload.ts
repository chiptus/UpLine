import {
  type DiffResult,
  type OrphanResolution,
  type SetPayload,
  type StageMismatchResolution,
} from "./types";

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
      stageName: resolveSetStageName(s.stageName),
    })),
    setsToUpdate: diff.cleanOperations.setsToUpdate.map((s) => ({
      ...s,
      stageName: resolveSetStageName(s.stageName),
    })),
    setIdsToArchive,
  };

  function resolveSetStageName(stageName: string | null): string | null {
    if (!stageName) return null;
    if (!mismatchedCsvValues.has(stageName)) return stageName;
    const resolution = stageMismatchResolutions[stageName];
    if (!resolution) return stageName;
    return resolution.action === "map" ? resolution.dbStageName : stageName;
  }
}
