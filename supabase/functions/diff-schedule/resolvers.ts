import type { CsvRow, DbArtist, DbSet, DbStage } from "./types.ts";
import {
  advanceDateByOne,
  artistKey,
  localToUtc,
  toSlug,
  utcToLocalDate,
} from "./helpers.ts";

export type DbIndexes = {
  stageByNameLower: Map<string, DbStage>;
  stageById: Map<string, DbStage>;
  existingArtistSlugs: Set<string>;
  setsByArtistKey: Map<string, DbSet[]>;
  artistlessSetsByNameLower: Map<string, DbSet[]>;
};

export function buildIndexes(
  dbStages: DbStage[],
  dbSets: DbSet[],
  dbArtists: DbArtist[],
): DbIndexes {
  // Artist-less sets are matched by name (+ date/stage) instead of by roster,
  // so they get their own index and stay out of the artist-key one — a roster
  // row must never match a 0-artist set and vice versa.
  const setsByArtistKey = new Map<string, DbSet[]>();
  const artistlessSetsByNameLower = new Map<string, DbSet[]>();
  for (const set of dbSets) {
    if (set.set_artists.length === 0) {
      const key = set.name.trim().toLowerCase();
      const bucket = artistlessSetsByNameLower.get(key) ?? [];
      bucket.push(set);
      artistlessSetsByNameLower.set(key, bucket);
      continue;
    }
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
    artistlessSetsByNameLower,
  };
}

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
    if (strippedDb === strippedInput) return true;
    // Substring matching false-positives on short names (a DB stage "a"
    // matches any CSV stage containing the letter), so require both
    // stripped names to be long enough before comparing as substrings.
    if (strippedDb.length < 3 || strippedInput.length < 3) return false;
    return (
      strippedDb.includes(strippedInput) || strippedInput.includes(strippedDb)
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

/** The CSV row's discriminators, as both matching functions consume them. */
export type MatchContext = {
  stage: StageResolution;
  date: string | undefined;
  timezone: string;
  name: string;
};

/**
 * Picks which existing set a roster row refers to, or null when the row is
 * new. The roster is the identity, so a stage/date/name difference never
 * rejects a match (it's just an update) — those fields only break ties
 * between sets sharing the same roster.
 */
export function findMatchingSet(
  candidates: DbSet[],
  context: MatchContext,
  alreadyMatched: Set<string>,
): DbSet | null {
  const stageId = context.stage.kind === "exact" ? context.stage.id : null;
  const pool = candidates.filter((s) => !alreadyMatched.has(s.id));
  return narrowByDiscriminators(pool, stageId, context);
}

/**
 * Picks which existing 0-artist set an artist-less row refers to, or null
 * when the row is new. The name is the only identity, so a supplied stage
 * or date must actually hold: a candidate whose stored value contradicts
 * the row is excluded (the row becomes a create), while candidates with no
 * stored stage/time still match — otherwise re-importing a time-less row
 * would duplicate it on every run.
 */
export function findMatchingArtistlessSet(
  candidates: DbSet[],
  context: MatchContext,
  alreadyMatched: Set<string>,
): DbSet | null {
  const stageSupplied = context.stage.kind !== "none";
  const stageId = provisionalStageId(context.stage);
  const pool = candidates.filter((s) => {
    if (alreadyMatched.has(s.id)) return false;
    if (stageSupplied && s.stage_id != null && s.stage_id !== stageId)
      return false;
    if (
      context.date &&
      s.time_start != null &&
      utcToLocalDate(s.time_start, context.timezone) !== context.date
    )
      return false;
    return true;
  });
  return narrowByDiscriminators(pool, stageId, context);
}

/**
 * The stage id to compare candidates against before the user has resolved
 * the row's stage: a mismatch stands in with its closest DB stage, a
 * new/absent stage pins no stage. Known limitation (#447): if the user
 * later maps a mismatch to a different stage, the set was already chosen
 * with this guess and the commit only rewrites stageName.
 */
function provisionalStageId(stage: StageResolution): string | null {
  switch (stage.kind) {
    case "exact":
      return stage.id;
    case "mismatch":
      return stage.closest.id;
    default:
      return null;
  }
}

/**
 * Picks the one candidate the row's discriminators point at, trusting
 * stage over date over set name (the most volatile column). A discriminator
 * no candidate satisfies is skipped rather than emptying the pool, so a
 * partially matching CSV row still falls back to the closest candidate.
 */
function narrowByDiscriminators(
  candidates: DbSet[],
  resolvedStageId: string | null,
  { date, timezone, name }: Pick<MatchContext, "date" | "timezone" | "name">,
): DbSet | null {
  let pool = candidates;
  if (pool.length <= 1) return pool[0] ?? null;

  if (resolvedStageId) {
    const byStage = pool.filter((s) => s.stage_id === resolvedStageId);
    if (byStage.length > 0) pool = byStage;
  }
  if (date) {
    const byDate = pool.filter(
      (s) =>
        s.time_start != null && utcToLocalDate(s.time_start, timezone) === date,
    );
    if (byDate.length > 0) pool = byDate;
  }
  if (name && pool.length > 1) {
    const nameLower = name.trim().toLowerCase();
    const byName = pool.filter(
      (s) => s.name.trim().toLowerCase() === nameLower,
    );
    if (byName.length > 0) pool = byName;
  }
  return pool[0];
}

function strip(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
