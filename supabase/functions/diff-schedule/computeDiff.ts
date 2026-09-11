import { asSetType } from "../_shared/setTypes.ts";
import { artistKey, utcToLocalDate } from "./helpers.ts";
import {
  buildIndexes,
  computeTimes,
  findMatchingArtistlessSet,
  findMatchingSet,
  resolveArtists,
  resolveStage,
  type StageResolution,
} from "./resolvers.ts";
import type {
  CsvRow,
  DbArtist,
  DbSet,
  DbStage,
  DiffPlan,
  SetPayload,
  SetStatus,
} from "./types.ts";

export function computeDiff(
  rows: CsvRow[],
  dbStages: DbStage[],
  dbSets: DbSet[],
  dbArtists: DbArtist[],
  timezone: string,
): DiffPlan {
  const indexes = buildIndexes(dbStages, dbSets, dbArtists);
  const state = createState();

  for (const row of rows) {
    const { slugs: artistSlugs, newArtists } = resolveArtists(
      row.artists,
      indexes.existingArtistSlugs,
    );
    collectNewArtists(state, newArtists);

    const stage = resolveStage(row.stage, dbStages, indexes.stageByNameLower);
    const resolvedStage = applyStageResolution(state, stage);

    const computedTime = computeTimes(row, timezone);

    const name = row.setName?.trim() || row.artists.join(" b2b ");

    const matchContext = { stage, date: row.date, timezone, name };
    const matched =
      row.artists.length === 0
        ? findMatchingArtistlessSet(
            indexes.artistlessSetsByNameLower.get(name.toLowerCase()) ?? [],
            matchContext,
            state.matchedSetIds,
          )
        : findMatchingSet(
            indexes.setsByArtistKey.get(artistKey(artistSlugs)) ?? [],
            matchContext,
            state.matchedSetIds,
          );

    const resolvedTime = matched
      ? resolveTimeForMatch(matched, computedTime, row.date, timezone)
      : computedTime;

    const payload: SetPayload = {
      name,
      setType: row.setType ?? null,
      description: row.description ?? null,
      stageName: resolvedStage.name,
      timeStart: resolvedTime.timeStart,
      timeEnd: resolvedTime.timeEnd,
      status: resolvedTime.status,
      artistSlugs,
    };

    if (matched) {
      state.matchedSetIds.add(matched.id);
      state.setsToUpdate.push({
        id: matched.id,
        previousSetType: asSetType(matched.set_type),
        ...payload,
      });
    } else {
      state.setsToCreate.push(payload);
    }
  }

  const orphanedSets = dbSets
    .filter((s) => !state.matchedSetIds.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      stage: indexes.stageById.get(s.stage_id ?? "")?.name ?? null,
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

// Everything computeDiff accumulates while walking the CSV rows.
type DiffState = {
  matchedSetIds: Set<string>;
  seenNewArtistSlugs: Set<string>;
  seenNewStageNames: Set<string>;
  seenMismatchedStages: Set<string>;
  artistsToCreate: { name: string; slug: string }[];
  stagesToCreate: { name: string }[];
  stageNameMismatches: DiffPlan["conflicts"]["stageNameMismatches"];
  setsToCreate: SetPayload[];
  setsToUpdate: DiffPlan["cleanOperations"]["setsToUpdate"];
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

/**
 * Reconciles a CSV row's computed time against the set it matched, so a
 * date-only (TBA) row never downgrades a set that already has a more
 * precise, real time on the same day.
 */
function resolveTimeForMatch(
  matched: DbSet,
  computed: {
    timeStart: string | null;
    timeEnd: string | null;
    status: SetStatus;
  },
  rowDate: string | undefined,
  timezone: string,
): { timeStart: string | null; timeEnd: string | null; status: SetStatus } {
  if (
    computed.status !== "tba" ||
    !rowDate ||
    !matched.time_start ||
    matched.status === "tba"
  ) {
    return computed;
  }
  const sameDay = utcToLocalDate(matched.time_start, timezone) === rowDate;
  return sameDay
    ? { timeStart: null, timeEnd: null, status: "confirmed" }
    : computed;
}

// Registers any artists not yet seen across the import as new.
function collectNewArtists(
  state: DiffState,
  newArtists: { name: string; slug: string }[],
): void {
  for (const artist of newArtists) {
    if (!state.seenNewArtistSlugs.has(artist.slug)) {
      state.seenNewArtistSlugs.add(artist.slug);
      state.artistsToCreate.push(artist);
    }
  }
}

// Records a stage resolution into state and returns the id/name to use for
// the row's set payload.
function applyStageResolution(
  state: DiffState,
  stage: StageResolution,
): { id: string | null; name: string | null } {
  switch (stage.kind) {
    case "exact":
      return { id: stage.id, name: stage.name };
    case "mismatch":
      if (!state.seenMismatchedStages.has(stage.resolvedName)) {
        state.seenMismatchedStages.add(stage.resolvedName);
        state.stageNameMismatches.push({
          csvValue: stage.resolvedName,
          closestDbValue: stage.closest.name,
          dbStageId: stage.closest.id,
        });
      }
      return { id: null, name: stage.resolvedName };
    case "new":
      if (!state.seenNewStageNames.has(stage.resolvedName)) {
        state.seenNewStageNames.add(stage.resolvedName);
        state.stagesToCreate.push({ name: stage.resolvedName });
      }
      return { id: null, name: stage.resolvedName };
    case "none":
      return { id: null, name: null };
  }
}
