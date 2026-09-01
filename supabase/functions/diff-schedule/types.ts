import type { Database } from "../_shared/database.types.ts";

import type { SetType } from "../_shared/setTypes.ts";

export type CsvRow = {
  artists: string[];
  setType?: SetType | null;
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
  | "id"
  | "name"
  | "description"
  | "stage_id"
  | "time_start"
  | "time_end"
  | "set_type"
> & {
  set_artists: { artist_id: string; artists: DbArtist }[];
};

export type SetPayload = {
  name: string;
  setType: SetType | null;
  description: string | null;
  stageName: string | null;
  timeStart: string | null;
  timeEnd: string | null;
  artistSlugs: string[];
};

// computeDiff is a pure function with no DB access, so it can't produce the
// watermark itself — index.ts fetches that separately and merges it in.
export type DiffPlan = {
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
    setsToUpdate: ({
      id: string;
      previousSetType: SetType | null;
    } & SetPayload)[];
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

// #42: opaque watermark over the edition's sets at Analyse time. Threaded
// back through commit-schedule unchanged so commit_schedule can detect a
// concurrent edit and abort instead of applying a stale plan.
export type DiffResult = DiffPlan & { watermark: string };
