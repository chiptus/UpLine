import { z } from "zod";
import { VOTES_TYPES } from "@/lib/voteConfig";
import { SET_TYPES } from "@/api/sets/types";

/** Array param whose unknown entries are dropped individually, not the whole array. */
function enumArrayParam<T extends string>(values: readonly T[]) {
  return z
    .array(z.string())
    .catch([])
    .transform((entries) => [
      ...new Set(
        entries.filter((entry): entry is T =>
          (values as readonly string[]).includes(entry),
        ),
      ),
    ]);
}

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
  /** Stage slugs (not ids) — resolved to ids internally by useUrlState. */
  stages: z.array(z.string()).catch([]),
  genres: z.array(z.string()).catch([]),
  minRating: z.coerce.number().catch(0),
  timelineView: timelineViewSchema.catch("list"),
  use24Hour: z.boolean().catch(true),
  invite: z.string().optional(),
  sortLocked: z.boolean().catch(false),
  types: enumArrayParam(SET_TYPES),
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
  types: [],
} satisfies Partial<FilterSortSearch>;

export const timelineSearchSchema = z.object({
  day: z.string().catch("all"),
  time: z.enum(["all", "morning", "afternoon", "evening"]).catch("all"),
  /** Stage slugs (not ids) — resolved to ids internally by useTimelineUrlState. */
  stages: z.array(z.string()).catch([]),
  votes: enumArrayParam(VOTES_TYPES),
  types: enumArrayParam(SET_TYPES),
  /** Viewport-centered moment; only written once the user scrolls. */
  scrollTo: z.string().optional().catch(undefined),
});

export type TimelineSearch = z.infer<typeof timelineSearchSchema>;

export const timelineSearchDefaults: TimelineSearch = {
  day: "all",
  time: "all",
  stages: [],
  votes: [],
  types: [],
};
