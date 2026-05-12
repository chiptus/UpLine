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

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function artistKey(slugs: string[]): string {
  return [...slugs].sort().join("|");
}

export function advanceDateByOne(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}

export function localToUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
): string {
  const localIso = `${dateStr}T${timeStr}:00`;
  const naiveUtc = new Date(localIso + "Z");
  // sv-SE locale gives "YYYY-MM-DD HH:MM:SS" — unambiguously parseable as UTC
  const localInTz = new Date(
    naiveUtc.toLocaleString("sv-SE", { timeZone: timezone }) + "Z",
  );
  const offsetMs = naiveUtc.getTime() - localInTz.getTime();
  return new Date(naiveUtc.getTime() + offsetMs).toISOString();
}

export function utcToLocalDate(utcIso: string, timezone: string): string {
  // sv-SE renders as "YYYY-MM-DD HH:MM:SS" so we can take the date portion.
  return new Date(utcIso)
    .toLocaleString("sv-SE", { timeZone: timezone })
    .split(" ")[0];
}

type DbIndexes = {
  stageByNameLower: Map<string, DbStage>;
  stageById: Map<string, DbStage>;
  existingArtistSlugs: Set<string>;
  setsByArtistKey: Map<string, DbSet[]>;
};

type StageResolution =
  | { kind: "exact"; id: string; name: string }
  | { kind: "mismatch"; resolvedName: string; closest: DbStage }
  | { kind: "new"; resolvedName: string }
  | { kind: "none" };

function buildIndexes(
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

function resolveArtists(
  row: CsvRow,
  existingSlugs: Set<string>,
  seenNewSlugs: Set<string>,
  artistsToCreate: { name: string; slug: string }[],
): string[] {
  const slugs: string[] = [];
  for (const name of row.artists) {
    const slug = toSlug(name);
    slugs.push(slug);
    if (!existingSlugs.has(slug) && !seenNewSlugs.has(slug)) {
      artistsToCreate.push({ name, slug });
      seenNewSlugs.add(slug);
    }
  }
  return slugs;
}

function resolveStage(
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

  function strip(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  const closeMatch = dbStages.find((s) => {
    const a = strip(s.name);
    const b = strip(lower);
    return a === b || a.includes(b) || b.includes(a);
  });

  if (closeMatch) {
    return { kind: "mismatch", resolvedName: rawStage, closest: closeMatch };
  }
  return { kind: "new", resolvedName: rawStage };
}

function computeTimes(
  row: CsvRow,
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

function findMatchingSet(
  candidates: DbSet[],
  resolvedStageId: string | null,
  date: string | undefined,
  timezone: string,
): DbSet | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  return (
    (resolvedStageId
      ? (candidates.find((s) => s.stage_id === resolvedStageId) ?? null)
      : null) ??
    (date
      ? (candidates.find(
          (s) =>
            s.time_start != null &&
            utcToLocalDate(s.time_start, timezone) === date,
        ) ?? null)
      : null) ??
    candidates[0]
  );
}

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
