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
  minRating: z.coerce.number().catch(0),
  timelineView: timelineViewSchema.catch("list"),
  use24Hour: z.boolean().catch(true),
  groupId: z.string().optional(),
  invite: z.string().optional(),
  sortLocked: z.boolean().catch(false),
});

export type FilterSortSearch = z.infer<typeof filterSortSearchSchema>;

export const filterSortSearchDefaults = {
  sort: "popularity-desc",
  stages: [],
  genres: [],
  minRating: 0,
  timelineView: "list",
  use24Hour: true,
  sortLocked: false,
} satisfies Partial<FilterSortSearch>;

export const timelineSearchSchema = z.object({
  day: z.string().catch("all"),
  time: z.enum(["all", "morning", "afternoon", "evening"]).catch("all"),
  stages: z.array(z.string()).catch([]),
});

export type TimelineSearch = z.infer<typeof timelineSearchSchema>;

export const timelineSearchDefaults: TimelineSearch = {
  day: "all",
  time: "all",
  stages: [],
};
