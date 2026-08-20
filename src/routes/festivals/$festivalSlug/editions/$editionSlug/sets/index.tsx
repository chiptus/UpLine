import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { FilteredSetsPanel } from "@/pages/EditionView/tabs/VoteTab/FilteredSetsPanel";
import { useUrlState } from "@/hooks/useUrlState";
import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { pageMeta } from "@/lib/pageHead";
import {
  filterSortSearchDefaults,
  filterSortSearchSchema,
} from "@/lib/searchSchemas";
import { genresQuery } from "@/api/genres/useGenres";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/",
)({
  component: VoteTab,
  head: ({ match }) => ({
    meta: pageMeta({ title: "Vote", prefix: match.context.festival.name }),
  }),
  validateSearch: filterSortSearchSchema,
  search: {
    middlewares: [stripSearchParams(filterSortSearchDefaults)],
  },
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(genresQuery());
  },
});

function VoteTab() {
  const { state: urlState, updateUrlState, clearFilters } = useUrlState();
  const { edition } = useFestivalEdition();

  const { data: sets = [], isLoading: setsLoading } = useSetsByEditionQuery(
    edition?.id,
  );

  if (setsLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-12">
          <div className="text-white text-xl">Loading artists...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <FilteredSetsPanel
          sets={sets}
          urlState={urlState}
          updateUrlState={updateUrlState}
          clearFilters={clearFilters}
          editionId={edition?.id || ""}
        />
      </div>
    </>
  );
}
