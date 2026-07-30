import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { ArtistsTab } from "@/pages/EditionView/tabs/ArtistsTab/ArtistsTab";
import {
  filterSortSearchDefaults,
  filterSortSearchSchema,
} from "@/lib/searchSchemas";
import { genresQuery } from "@/api/genres/useGenres";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/",
)({
  component: ArtistsTab,
  validateSearch: filterSortSearchSchema,
  search: {
    middlewares: [stripSearchParams(filterSortSearchDefaults)],
  },
  loaderDeps: ({ search }) => ({ groupId: search.groupId }),
  loader: async ({ context, deps }) => {
    void context.queryClient.ensureQueryData(genresQuery());
    if (deps.groupId) {
      void context.queryClient.ensureQueryData(groupMembersQuery(deps.groupId));
    }
  },
});
