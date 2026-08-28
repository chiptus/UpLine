import type { DbArtist, DbSet, DbStage } from "./types.ts";

export function makeArtist(name: string): DbArtist {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return { id: `id-${slug}`, name, slug };
}

export function makeStage(id: string, name: string): DbStage {
  return { id, name };
}

export function makeSet(
  id: string,
  name: string,
  artists: DbArtist[],
  stageId: string | null = null,
  timeStart: string | null = null,
): DbSet {
  return {
    id,
    name,
    description: null,
    set_type: null,
    stage_id: stageId,
    time_start: timeStart,
    time_end: null,
    set_artists: artists.map((a) => ({ artist_id: a.id, artists: a })),
  };
}
