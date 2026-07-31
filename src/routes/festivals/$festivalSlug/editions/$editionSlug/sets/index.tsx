import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FilterSortControls } from "@/pages/EditionView/tabs/ArtistsTab/filters/FilterSortControls";
import { useSetFiltering } from "@/pages/EditionView/tabs/ArtistsTab/useSetFiltering";
import { useUrlState, type FilterSortState } from "@/hooks/useUrlState";
import { SetsPanel } from "@/pages/EditionView/tabs/ArtistsTab/SetsPanel";
import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";
import type { FestivalSet } from "@/api/sets/types";
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

  // Fetch sets for the current edition
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

interface FilteredSetsPanelProps {
  sets: FestivalSet[];
  urlState: FilterSortState;
  updateUrlState: (updates: Partial<FilterSortState>) => void;
}

// Gates whether the group-members query is mounted at all, so selecting a
// group filter for the first time suspends this section rather than
// requiring a separate loading state.
function FilteredSetsPanel({
  sets,
  urlState,
  updateUrlState,
}: FilteredSetsPanelProps) {
  if (urlState.groupId) {
    return (
      <GroupFilteredSetsPanel
        sets={sets}
        urlState={urlState}
        updateUrlState={updateUrlState}
        groupId={urlState.groupId}
      />
    );
  }

  return (
    <SetsPanelContent
      sets={sets}
      urlState={urlState}
      updateUrlState={updateUrlState}
    />
  );
}

function GroupFilteredSetsPanel({
  sets,
  urlState,
  updateUrlState,
  groupId,
}: FilteredSetsPanelProps & { groupId: string }) {
  const { data: members } = useSuspenseQuery(groupMembersQuery(groupId));
  const groupMemberIds = useMemo(
    () => new Set(members.map((member) => member.user_id)),
    [members],
  );

  return (
    <SetsPanelContent
      sets={sets}
      urlState={urlState}
      updateUrlState={updateUrlState}
      groupMemberIds={groupMemberIds}
    />
  );
}

function SetsPanelContent({
  sets,
  urlState,
  updateUrlState,
  groupMemberIds = new Set<string>(),
}: FilteredSetsPanelProps & { groupMemberIds?: Set<string> }) {
  const { filteredAndSortedSets, lockCurrentOrder } = useSetFiltering(
    sets,
    urlState,
    groupMemberIds,
  );

  return (
    <SetsPanel
      sets={filteredAndSortedSets}
      use24Hour={urlState.use24Hour}
      onLockSort={() => lockCurrentOrder(updateUrlState)}
    />
  );
}
