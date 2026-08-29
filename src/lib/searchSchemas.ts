import { z } from "zod";
import { VOTES_TYPES, type VoteType } from "@/lib/voteConfig";
import { SET_TYPES, type SetType } from "@/api/sets/types";

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
  token: z.string().optional(),
  sortLocked: z.boolean().catch(false),
  /** Set-type filter values; unknown entries are dropped individually. */
  types: z
    .array(z.string())
    .catch([])
    .transform((types) => [
      ...new Set(
        types.filter((t): t is SetType =>
          (SET_TYPES as readonly string[]).includes(t),
        ),
      ),
    ]),
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
  /** Unknown entries are dropped individually, not the whole array. */
  votes: z
    .array(z.string())
    .catch([])
    .transform((votes) => [
      ...new Set(
        votes.filter((vote): vote is VoteType =>
          (VOTES_TYPES as readonly string[]).includes(vote),
        ),
      ),
    ]),
  /** Viewport-centered moment; only written once the user scrolls. */
  scrollTo: z.string().optional().catch(undefined),
});

export type TimelineSearch = z.infer<typeof timelineSearchSchema>;

export const timelineSearchDefaults: TimelineSearch = {
  day: "all",
  time: "all",
  stages: [],
  votes: [],
};
