import { z } from "zod";
import { VOTES_TYPES, type VoteType } from "@/lib/voteConfig";

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
  /**
   * `undefined` means "not explicitly chosen" — the effective default
   * (Active Group when one exists, else Me) is resolved by the consuming
   * hook, not baked into this schema.
   */
  voteScope: z.enum(["me", "group"]).optional().catch(undefined),
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
