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
  stage_id: string | null;
  time_start: string | null;
  time_end: string | null;
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

export function localToUtc(dateStr: string, timeStr: string, timezone: string): string {
  const localIso = `${dateStr}T${timeStr}:00`;
  const naiveUtc = new Date(localIso + "Z");
  // sv-SE locale gives "YYYY-MM-DD HH:MM:SS" — unambiguously parseable as UTC
  const localInTz = new Date(
    naiveUtc.toLocaleString("sv-SE", { timeZone: timezone }) + "Z",
  );
  const offsetMs = naiveUtc.getTime() - localInTz.getTime();
  return new Date(naiveUtc.getTime() + offsetMs).toISOString();
}

export function computeDiff(
  rows: CsvRow[],
  dbStages: DbStage[],
  dbSets: DbSet[],
  dbArtists: DbArtist[],
  timezone: string,
): DiffResult {
  const stageByNameLower = new Map(dbStages.map((s) => [s.name.toLowerCase(), s]));
  const existingArtistSlugs = new Set(dbArtists.map((a) => a.slug));

  const setsByArtistKey = new Map<string, DbSet[]>();
  for (const set of dbSets) {
    const slugs = set.set_artists.map((sa) => sa.artists.slug);
    const key = artistKey(slugs);
    const bucket = setsByArtistKey.get(key) ?? [];
    bucket.push(set);
    setsByArtistKey.set(key, bucket);
  }

  const matchedSetIds = new Set<string>();
  const seenNewArtistSlugs = new Set<string>();
  const seenNewStageNames = new Set<string>();
  const seenMismatchedStages = new Set<string>();

  const artistsToCreate: { name: string; slug: string }[] = [];
  const stagesToCreate: { name: string }[] = [];
  const stageNameMismatches: DiffResult["conflicts"]["stageNameMismatches"] = [];
  const setsToCreate: SetPayload[] = [];
  const setsToUpdate: ({ id: string } & SetPayload)[] = [];

  for (const row of rows) {
    const artistSlugs: string[] = [];
    for (const name of row.artists) {
      const slug = toSlug(name);
      artistSlugs.push(slug);
      if (!existingArtistSlugs.has(slug) && !seenNewArtistSlugs.has(slug)) {
        artistsToCreate.push({ name, slug });
        seenNewArtistSlugs.add(slug);
      }
    }

    let resolvedStageId: string | null = null;
    if (row.stage) {
      const lower = row.stage.toLowerCase();
      const exactMatch = stageByNameLower.get(lower);
      if (exactMatch) {
        resolvedStageId = exactMatch.id;
      } else {
        const strip = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const closeMatch = dbStages.find((s) => {
          const a = strip(s.name);
          const b = strip(lower);
          return a === b || a.includes(b) || b.includes(a);
        });
        if (closeMatch && !seenMismatchedStages.has(row.stage)) {
          stageNameMismatches.push({
            csvValue: row.stage,
            closestDbValue: closeMatch.name,
            dbStageId: closeMatch.id,
          });
          seenMismatchedStages.add(row.stage);
        } else if (!closeMatch && !seenNewStageNames.has(row.stage)) {
          stagesToCreate.push({ name: row.stage });
          seenNewStageNames.add(row.stage);
        }
      }
    }

    let timeStart: string | null = null;
    let timeEnd: string | null = null;
    if (row.date && row.startTime) {
      timeStart = localToUtc(row.date, row.startTime, timezone);
    }
    if (row.date && row.endTime) {
      const crossesMidnight = row.startTime != null && row.endTime < row.startTime;
      const endDate = crossesMidnight ? advanceDateByOne(row.date) : row.date;
      timeEnd = localToUtc(endDate, row.endTime, timezone);
    }

    const setName = row.setName?.trim() || row.artists.join(" b2b ");
    const key = artistKey(artistSlugs);
    const candidates = setsByArtistKey.get(key) ?? [];

    let matched: DbSet | null = null;
    if (candidates.length === 1) {
      matched = candidates[0];
    } else if (candidates.length > 1) {
      matched =
        (resolvedStageId
          ? candidates.find((s) => s.stage_id === resolvedStageId) ?? null
          : null) ??
        (row.date
          ? candidates.find((s) => s.time_start?.startsWith(row.date!)) ?? null
          : null) ??
        candidates[0];
    }

    const payload: SetPayload = {
      name: setName,
      description: row.description ?? null,
      stage_id: resolvedStageId,
      time_start: timeStart,
      time_end: timeEnd,
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
      stage: dbStages.find((st) => st.id === s.stage_id)?.name ?? null,
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
    cleanOperations: { artistsToCreate, stagesToCreate, setsToCreate, setsToUpdate },
    conflicts: { stageNameMismatches, orphanedSets },
  };
}
