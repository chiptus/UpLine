import { z } from "zod";

export const sortOptionSchema = z.enum([
  "name-asc",
  "name-desc",
  "rating-desc",
  "popularity-desc",
  "date-asc",
]);

export const timelineViewSchema = z.enum(["horizontal", "list"]);

export const filterSortSearchSchema = z.object({
  sort: sortOptionSchema.optional(),
  stages: z.string().optional(),
  genres: z.string().optional(),
  minRating: z.string().optional(),
  timelineView: timelineViewSchema.optional(),
  use24Hour: z.string().optional(),
  groupId: z.string().optional(),
  invite: z.string().optional(),
  sortLocked: z.string().optional(),
  votePerspective: z.string().optional(),
});

export type FilterSortSearch = z.infer<typeof filterSortSearchSchema>;

export const timelineSearchSchema = z.object({
  view: timelineViewSchema.optional(),
  day: z.string().optional(),
  time: z.enum(["all", "morning", "afternoon", "evening"]).optional(),
  stages: z.string().optional(),
});

export type TimelineSearch = z.infer<typeof timelineSearchSchema>;
