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
  sort: sortOptionSchema.catch("popularity-desc"),
  stages: z.array(z.string()).catch([]),
  genres: z.array(z.string()).catch([]),
  minRating: z.number().catch(0),
  timelineView: timelineViewSchema.catch("list"),
  use24Hour: z.boolean().catch(true),
  groupId: z.string().optional(),
  invite: z.string().optional(),
  sortLocked: z.boolean().catch(false),
  votePerspective: z.string().optional(),
});

export type FilterSortSearch = z.infer<typeof filterSortSearchSchema>;

export const timelineSearchSchema = z.object({
  view: timelineViewSchema.catch("list"),
  day: z.string().catch("all"),
  time: z.enum(["all", "morning", "afternoon", "evening"]).catch("all"),
  stages: z.array(z.string()).catch([]),
});

export type TimelineSearch = z.infer<typeof timelineSearchSchema>;

export const timelineSearchDefaults: TimelineSearch = {
  view: "list",
  day: "all",
  time: "all",
  stages: [],
};
