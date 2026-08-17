import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FilterSortControls } from "@/pages/EditionView/tabs/VoteTab/filters/FilterSortControls";
import { GroupScopedSetsPanel } from "@/pages/EditionView/tabs/VoteTab/GroupScopedSetsPanel";
import { EveryoneSetsPanel } from "@/pages/EditionView/tabs/VoteTab/SetsPanelContent";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import type { FilteredSetsPanelProps } from "@/pages/EditionView/tabs/VoteTab/FilteredSetsPanel";
import type { BinaryVoteScope, VoteScope } from "@/lib/voteScope";

export function AuthedFilteredSetsPanel(
  props: FilteredSetsPanelProps & { userId: string },
) {
  const { current, activeGroupId } = useActiveScope();
  const { data: groups } = useSuspenseQuery(userGroupsQuery(props.userId));
  const activeGroupName = activeGroupId
    ? groups.find((group) => group.id === activeGroupId)?.name
    : undefined;
  const [perspective, setPerspective] = useState<BinaryVoteScope>(
    current.kind === "group" ? "group" : "everyone",
  );

  const voteScope: VoteScope =
    perspective === "group" && activeGroupId ? "group" : "everyone";

  return (
    <>
      <FilterSortControls
        state={props.urlState}
        onStateChange={props.updateUrlState}
        onClear={props.clearFilters}
        editionId={props.editionId}
        votePerspective={
          activeGroupId && activeGroupName
            ? {
                scope: voteScope,
                onScopeChange: setPerspective,
                groupName: activeGroupName,
              }
            : undefined
        }
      />

      <div className="mt-8">
        {voteScope === "group" && activeGroupId ? (
          <GroupScopedSetsPanel
            sets={props.sets}
            urlState={props.urlState}
            updateUrlState={props.updateUrlState}
            groupId={activeGroupId}
          />
        ) : (
          <EveryoneSetsPanel
            sets={props.sets}
            urlState={props.urlState}
            updateUrlState={props.updateUrlState}
          />
        )}
      </div>
    </>
  );
}
