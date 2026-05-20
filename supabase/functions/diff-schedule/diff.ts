import type { Database } from "../_shared/database.types.ts";
import { artistKey } from "./diffHelpers.ts";
import {
  buildIndexes,
  computeTimes,
  type DbIndexes,
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

// Narrow the generated row types to just the columns the diff needs.
// The diff query selects a subset; mirroring it here keeps the consumer
// surface tight while still letting tsc catch column drift.
type StageRow = Database["public"]["Tables"]["stages"]["Row"];
type ArtistRow = Database["public"]["Tables"]["artists"]["Row"];
type SetRow = Database["public"]["Tables"]["sets"]["Row"];

export type DbStage = Pick<StageRow, "id" | "name">;
export type DbArtist = Pick<ArtistRow, "id" | "name" | "slug">;
export type DbSet = Pick<
  SetRow,
  "id" | "name" | "description" | "stage_id" | "time_start" | "time_end"
> & {
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

// Everything computeDiff accumulates while walking the CSV rows. handleRow
// folds one row into this; computeDiff reads it out into the DiffResult.
type DiffState = {
  matchedSetIds: Set<string>;
  seenNewArtistSlugs: Set<string>;
  seenNewStageNames: Set<string>;
  seenMismatchedStages: Set<string>;
  artistsToCreate: { name: string; slug: string }[];
  stagesToCreate: { name: string }[];
  stageNameMismatches: DiffResult["conflicts"]["stageNameMismatches"];
  setsToCreate: SetPayload[];
  setsToUpdate: ({ id: string } & SetPayload)[];
};

type RowContext = {
  indexes: DbIndexes;
  dbStages: DbStage[];
  timezone: string;
};

function createState(): DiffState {
  return {
    matchedSetIds: new Set(),
    seenNewArtistSlugs: new Set(),
    seenNewStageNames: new Set(),
    seenMismatchedStages: new Set(),
    artistsToCreate: [],
    stagesToCreate: [],
    stageNameMismatches: [],
    setsToCreate: [],
    setsToUpdate: [],
  };
}

// Folds a single CSV row into the running state: registers any new artists
// and stages, resolves the stage, then matches the row to an existing set
// or queues a new one.
function handleRow(state: DiffState, row: CsvRow, ctx: RowContext): DiffState {
  const { indexes, dbStages, timezone } = ctx;

  const { slugs: artistSlugs, newArtists } = resolveArtists(
    row.artists,
    indexes.existingArtistSlugs,
  );
  for (const artist of newArtists) {
    if (!state.seenNewArtistSlugs.has(artist.slug)) {
      state.seenNewArtistSlugs.add(artist.slug);
      state.artistsToCreate.push(artist);
    }
  }

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
      if (!state.seenMismatchedStages.has(stage.resolvedName)) {
        state.seenMismatchedStages.add(stage.resolvedName);
        state.stageNameMismatches.push({
          csvValue: stage.resolvedName,
          closestDbValue: stage.closest.name,
          dbStageId: stage.closest.id,
        });
      }
      break;
    case "new":
      resolvedStageName = stage.resolvedName;
      if (!state.seenNewStageNames.has(stage.resolvedName)) {
        state.seenNewStageNames.add(stage.resolvedName);
        state.stagesToCreate.push({ name: stage.resolvedName });
      }
      break;
    case "none":
      break;
  }

  const { timeStart, timeEnd } = computeTimes(row, timezone);

  const candidates = indexes.setsByArtistKey.get(artistKey(artistSlugs)) ?? [];
  const matched = findMatchingSet(
    candidates,
    resolvedStageId,
    row.date,
    timezone,
    state.matchedSetIds,
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
    state.matchedSetIds.add(matched.id);
    state.setsToUpdate.push({ id: matched.id, ...payload });
  } else {
    state.setsToCreate.push(payload);
  }

  return state;
}

export function computeDiff(
  rows: CsvRow[],
  dbStages: DbStage[],
  dbSets: DbSet[],
  dbArtists: DbArtist[],
  timezone: string,
): DiffResult {
  const ctx: RowContext = {
    indexes: buildIndexes(dbStages, dbSets, dbArtists),
    dbStages,
    timezone,
  };

  let state = createState();
  for (const row of rows) {
    state = handleRow(state, row, ctx);
  }

  const orphanedSets = dbSets
    .filter((s) => !state.matchedSetIds.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      stage: ctx.indexes.stageById.get(s.stage_id ?? "")?.name ?? null,
      timeStart: s.time_start,
    }));

  return {
    summary: {
      newArtists: state.artistsToCreate.length,
      newStages: state.stagesToCreate.length,
      setsMatched: state.matchedSetIds.size,
      setsToCreate: state.setsToCreate.length,
      setsOrphaned: orphanedSets.length,
    },
    newArtistNames: state.artistsToCreate.map((a) => a.name),
    cleanOperations: {
      artistsToCreate: state.artistsToCreate,
      stagesToCreate: state.stagesToCreate,
      setsToCreate: state.setsToCreate,
      setsToUpdate: state.setsToUpdate,
    },
    conflicts: { stageNameMismatches: state.stageNameMismatches, orphanedSets },
  };
}
