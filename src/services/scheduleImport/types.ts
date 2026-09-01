import { z } from "zod";
import { SET_TYPES, type SetType } from "@/api/sets/types";

export type CsvRow = {
  artists: string[];
  setType: SetType | null;
  setName?: string;
  stage?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
};

export const setPayloadSchema = z.object({
  name: z.string(),
  setType: z.enum(SET_TYPES).nullable(),
  description: z.string().nullable(),
  stageName: z.string().nullable(),
  timeStart: z.string().nullable(),
  timeEnd: z.string().nullable(),
  artistSlugs: z.array(z.string()),
});
export type SetPayload = z.infer<typeof setPayloadSchema>;

export const diffResultSchema = z.object({
  watermark: z.string(),
  summary: z.object({
    newArtists: z.number(),
    newStages: z.number(),
    setsMatched: z.number(),
    setsToCreate: z.number(),
    setsOrphaned: z.number(),
  }),
  newArtistNames: z.array(z.string()),
  cleanOperations: z.object({
    artistsToCreate: z.array(z.object({ name: z.string(), slug: z.string() })),
    stagesToCreate: z.array(z.object({ name: z.string() })),
    setsToCreate: z.array(setPayloadSchema),
    setsToUpdate: z.array(
      setPayloadSchema.extend({
        id: z.string(),
        // The matched set's stored type, so the review can render
        // stored → incoming chips. Not written on commit.
        previousSetType: z.enum(SET_TYPES).nullable(),
      }),
    ),
  }),
  conflicts: z.object({
    stageNameMismatches: z.array(
      z.object({
        csvValue: z.string(),
        closestDbValue: z.string(),
        dbStageId: z.string(),
      }),
    ),
    orphanedSets: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        stage: z.string().nullable(),
        timeStart: z.string().nullable(),
      }),
    ),
  }),
});
export type DiffResult = z.infer<typeof diffResultSchema>;

export const commitResultSchema = z.object({
  setsCreated: z.number(),
  setsUpdated: z.number(),
  setsArchived: z.number(),
});
export type CommitResult = z.infer<typeof commitResultSchema>;

export type StageMismatchResolution =
  | { action: "map"; dbStageName: string }
  | { action: "create" };

export type OrphanResolution = "archive" | "keep";

// #42: commit_schedule prefixes its watermark-mismatch exception with this
// marker (see the commit_schedule_watermark migration) so the review step
// can show a dedicated "re-run Analyse" message instead of a generic
// commit-failure alert.
const EDITION_CHANGED_ERROR_PREFIX = "edition_changed_since_analyse:";

export function isEditionChangedError(message: string): boolean {
  return message.startsWith(EDITION_CHANGED_ERROR_PREFIX);
}
