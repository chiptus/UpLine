import type { CsvRow, DbArtist, DbSet, DbStage } from "./diff.ts";
import {
  advanceDateByOne,
  artistKey,
  localToUtc,
  toSlug,
  utcToLocalDate,
} from "./diffHelpers.ts";

export type DbIndexes = {
  stageByNameLower: Map<string, DbStage>;
  stageById: Map<string, DbStage>;
  existingArtistSlugs: Set<string>;
  setsByArtistKey: Map<string, DbSet[]>;
};

export function buildIndexes(
  dbStages: DbStage[],
  dbSets: DbSet[],
  dbArtists: DbArtist[],
): DbIndexes {
  const setsByArtistKey = new Map<string, DbSet[]>();
  for (const set of dbSets) {
    const slugs = set.set_artists.map((sa) => sa.artists.slug);
    const key = artistKey(slugs);
    const bucket = setsByArtistKey.get(key) ?? [];
    bucket.push(set);
    setsByArtistKey.set(key, bucket);
  }
  return {
    stageByNameLower: new Map(dbStages.map((s) => [s.name.toLowerCase(), s])),
    stageById: new Map(dbStages.map((s) => [s.id, s])),
    existingArtistSlugs: new Set(dbArtists.map((a) => a.slug)),
    setsByArtistKey,
  };
}

// Pure: returns the slug for every artist name in the row, plus the subset
// that doesn't already exist in the DB. De-duplicating new artists across
// rows is the caller's job — this function never mutates its arguments.
export function resolveArtists(
  artistNames: string[],
  existingSlugs: Set<string>,
): { slugs: string[]; newArtists: { name: string; slug: string }[] } {
  const slugs: string[] = [];
  const newArtists: { name: string; slug: string }[] = [];
  for (const name of artistNames) {
    const slug = toSlug(name);
    slugs.push(slug);
    if (!existingSlugs.has(slug)) {
      newArtists.push({ name, slug });
    }
  }
  return { slugs, newArtists };
}

export type StageResolution =
  | { kind: "exact"; id: string; name: string }
  | { kind: "mismatch"; resolvedName: string; closest: DbStage }
  | { kind: "new"; resolvedName: string }
  | { kind: "none" };

export function resolveStage(
  rawStage: string | undefined,
  dbStages: DbStage[],
  stageByNameLower: Map<string, DbStage>,
): StageResolution {
  if (!rawStage) return { kind: "none" };

  const lower = rawStage.toLowerCase();
  const exactMatch = stageByNameLower.get(lower);
  if (exactMatch) {
    return { kind: "exact", id: exactMatch.id, name: exactMatch.name };
  }

  const strippedInput = strip(lower);
  const closeMatch = dbStages.find((s) => {
    const strippedDb = strip(s.name);
    return (
      strippedDb === strippedInput ||
      strippedDb.includes(strippedInput) ||
      strippedInput.includes(strippedDb)
    );
  });

  if (closeMatch) {
    return { kind: "mismatch", resolvedName: rawStage, closest: closeMatch };
  }
  return { kind: "new", resolvedName: rawStage };
}

export function computeTimes(
  row: Pick<CsvRow, "date" | "startTime" | "endTime">,
  timezone: string,
): { timeStart: string | null; timeEnd: string | null } {
  let timeStart: string | null = null;
  let timeEnd: string | null = null;
  if (row.date && row.startTime) {
    timeStart = localToUtc(row.date, row.startTime, timezone);
  }
  if (row.date && row.endTime) {
    const crossesMidnight =
      row.startTime != null && row.endTime < row.startTime;
    const endDate = crossesMidnight ? advanceDateByOne(row.date) : row.date;
    timeEnd = localToUtc(endDate, row.endTime, timezone);
  }
  return { timeStart, timeEnd };
}

export function findMatchingSet(
  candidates: DbSet[],
  resolvedStageId: string | null,
  date: string | undefined,
  timezone: string,
  alreadyMatched: Set<string>,
): DbSet | null {
  const available = candidates.filter((s) => !alreadyMatched.has(s.id));
  if (available.length <= 1) return available[0] ?? null;

  if (resolvedStageId) {
    const byStage = available.find((s) => s.stage_id === resolvedStageId);
    if (byStage) return byStage;
  }
  if (date) {
    const byDate = available.find(
      (s) =>
        s.time_start != null && utcToLocalDate(s.time_start, timezone) === date,
    );
    if (byDate) return byDate;
  }
  return available[0];
}

function strip(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
