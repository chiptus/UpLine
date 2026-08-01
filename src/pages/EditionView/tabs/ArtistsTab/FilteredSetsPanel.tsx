import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SetsPanel } from "@/pages/EditionView/tabs/ArtistsTab/SetsPanel";
import { useSetFiltering } from "@/pages/EditionView/tabs/ArtistsTab/useSetFiltering";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import type { FestivalSet } from "@/api/sets/types";
import type { FilterSortState } from "@/hooks/useUrlState";

interface FilteredSetsPanelProps {
  sets: FestivalSet[];
  urlState: FilterSortState;
  updateUrlState: (updates: Partial<FilterSortState>) => void;
}

// Gates whether the group-members query is mounted at all, so selecting a
// group filter for the first time suspends this section rather than
// requiring a separate loading state.
export function FilteredSetsPanel({
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
