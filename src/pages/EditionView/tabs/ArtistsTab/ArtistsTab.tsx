import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FilterSortControls } from "./filters/FilterSortControls";
import { useSetFiltering } from "./useSetFiltering";
import { useUrlState, type FilterSortState } from "@/hooks/useUrlState";
import { SetsPanel } from "./SetsPanel";
import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";
import type { FestivalSet } from "@/api/sets/types";

export function ArtistsTab() {
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
    () => new Set(members.map((member) => member.id)),
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
