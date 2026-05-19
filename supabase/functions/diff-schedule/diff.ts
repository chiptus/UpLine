import { artistKey } from "./diffHelpers.ts";
import {
  buildIndexes,
  computeTimes,
  findMatchingSet,
  resolveArtists,
  resolveStage,
} from "./diffResolvers.ts";

export type CsvRow = {
  artists: string[];
  setName?: string;
  stage?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
};

export type DbStage = { id: string; name: string };
export type DbArtist = { id: string; name: string; slug: string };
export type DbSet = {
  id: string;
  name: string;
  description: string | null;
  stage_id: string | null;
  time_start: string | null;
  time_end: string | null;
  set_artists: { artist_id: string; artists: DbArtist }[];
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

export function computeDiff(
  rows: CsvRow[],
  dbStages: DbStage[],
  dbSets: DbSet[],
  dbArtists: DbArtist[],
  timezone: string,
): DiffResult {
  const indexes = buildIndexes(dbStages, dbSets, dbArtists);

  const matchedSetIds = new Set<string>();
  const seenNewArtistSlugs = new Set<string>();
  const seenNewStageNames = new Set<string>();
  const seenMismatchedStages = new Set<string>();

  const artistsToCreate: { name: string; slug: string }[] = [];
  const stagesToCreate: { name: string }[] = [];
  const stageNameMismatches: DiffResult["conflicts"]["stageNameMismatches"] =
    [];
  const setsToCreate: SetPayload[] = [];
  const setsToUpdate: ({ id: string } & SetPayload)[] = [];

  for (const row of rows) {
    const artistSlugs = resolveArtists(
      row,
      indexes.existingArtistSlugs,
      seenNewArtistSlugs,
      artistsToCreate,
    );

    const stage = resolveStage(row.stage, dbStages, indexes.stageByNameLower);
    let resolvedStageId: string | null = null;
    let resolvedStageName: string | null = null;
    switch (stage.kind) {
      case "exact":
        resolvedStageId = stage.id;
        resolvedStageName = stage.name;
        break;
      case "mismatch":
        resolvedStageName = stage.resolvedName;
        if (!seenMismatchedStages.has(stage.resolvedName)) {
          stageNameMismatches.push({
            csvValue: stage.resolvedName,
            closestDbValue: stage.closest.name,
            dbStageId: stage.closest.id,
          });
          seenMismatchedStages.add(stage.resolvedName);
        }
        break;
      case "new":
        resolvedStageName = stage.resolvedName;
        if (!seenNewStageNames.has(stage.resolvedName)) {
          stagesToCreate.push({ name: stage.resolvedName });
          seenNewStageNames.add(stage.resolvedName);
        }
        break;
      case "none":
        break;
    }

    const { timeStart, timeEnd } = computeTimes(row, timezone);

    const candidates =
      indexes.setsByArtistKey.get(artistKey(artistSlugs)) ?? [];
    const matched = findMatchingSet(
      candidates,
      resolvedStageId,
      row.date,
      timezone,
      matchedSetIds,
    );

    const payload: SetPayload = {
      name: row.setName?.trim() || row.artists.join(" b2b "),
      description: row.description ?? null,
      stageName: resolvedStageName,
      timeStart,
      timeEnd,
      artistSlugs,
    };

    if (matched) {
      matchedSetIds.add(matched.id);
      setsToUpdate.push({ id: matched.id, ...payload });
    } else {
      setsToCreate.push(payload);
    }
  }

  const orphanedSets = dbSets
    .filter((s) => !matchedSetIds.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      stage: indexes.stageById.get(s.stage_id ?? "")?.name ?? null,
      timeStart: s.time_start,
    }));

  return {
    summary: {
      newArtists: artistsToCreate.length,
      newStages: stagesToCreate.length,
      setsMatched: matchedSetIds.size,
      setsToCreate: setsToCreate.length,
      setsOrphaned: orphanedSets.length,
    },
    newArtistNames: artistsToCreate.map((a) => a.name),
    cleanOperations: {
      artistsToCreate,
      stagesToCreate,
      setsToCreate,
      setsToUpdate,
    },
    conflicts: { stageNameMismatches, orphanedSets },
  };
}
