import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { FilterSortControls } from "@/pages/EditionView/tabs/ArtistsTab/filters/FilterSortControls";
import { FilteredSetsPanel } from "@/pages/EditionView/tabs/ArtistsTab/FilteredSetsPanel";
import { useUrlState } from "@/hooks/useUrlState";
import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";
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
  loaderDeps: ({ search }) => ({ groupId: search.groupId }),
  loader: async ({ context, deps }) => {
    void context.queryClient.ensureQueryData(genresQuery());
    if (deps.groupId) {
      void context.queryClient.ensureQueryData(groupMembersQuery(deps.groupId));
    }
  },
});

function ArtistsTab() {
  const { state: urlState, updateUrlState, clearFilters } = useUrlState();
  const { edition, festival } = useFestivalEdition();

  const { data: sets = [], isLoading: setsLoading } = useSetsByEditionQuery(
    edition?.id,
  );

  if (setsLoading) {
    return (
      <>
        <PageTitle title="Vote" prefix={festival?.name} />
        <div className="flex items-center justify-center py-12">
          <div className="text-white text-xl">Loading artists...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Vote" prefix={festival?.name} />
      <div>
        <FilterSortControls
          state={urlState}
          onStateChange={updateUrlState}
          onClear={clearFilters}
          editionId={edition?.id || ""}
        />

        <div className="mt-8">
          <FilteredSetsPanel
            sets={sets}
            urlState={urlState}
            updateUrlState={updateUrlState}
          />
        </div>
      </div>
    </>
  );
}
