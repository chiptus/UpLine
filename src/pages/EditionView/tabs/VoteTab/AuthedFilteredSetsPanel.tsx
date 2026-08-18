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
  const perspectiveGroupId =
    current.kind === "group" ? current.groupId : activeGroupId;
  const perspectiveGroupName = perspectiveGroupId
    ? groups.find((group) => group.id === perspectiveGroupId)?.name
    : undefined;
  const [perspective, setPerspective] = useState<BinaryVoteScope>(
    current.kind === "group" ? "group" : "everyone",
  );

  const voteScope: VoteScope =
    perspective === "group" && perspectiveGroupId ? "group" : "everyone";

  return (
    <>
      <FilterSortControls
        state={props.urlState}
        onStateChange={props.updateUrlState}
        onClear={props.clearFilters}
        editionId={props.editionId}
        votePerspective={
          perspectiveGroupId && perspectiveGroupName
            ? {
                scope: voteScope,
                onScopeChange: setPerspective,
                groupName: perspectiveGroupName,
              }
            : undefined
        }
      />

      <div className="mt-8">
        {voteScope === "group" && perspectiveGroupId ? (
          <GroupScopedSetsPanel
            sets={props.sets}
            urlState={props.urlState}
            updateUrlState={props.updateUrlState}
            groupId={perspectiveGroupId}
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
