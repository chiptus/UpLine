import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { ArtistsTab } from "@/pages/EditionView/tabs/ArtistsTab/ArtistsTab";
import {
  filterSortSearchDefaults,
  filterSortSearchSchema,
} from "@/lib/searchSchemas";
import { genresQuery } from "@/api/genres/useGenres";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/",
)({
  component: ArtistsTab,
  validateSearch: filterSortSearchSchema,
  search: {
    middlewares: [stripSearchParams(filterSortSearchDefaults)],
  },
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(genresQuery());
  },
});
