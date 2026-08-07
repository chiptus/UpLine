import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SetsPanel } from "@/pages/EditionView/tabs/VoteTab/SetsPanel";
import { useSetFiltering } from "@/pages/EditionView/tabs/VoteTab/useSetFiltering";
import { FilterSortControls } from "@/pages/EditionView/tabs/VoteTab/filters/FilterSortControls";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import type { FestivalSet } from "@/api/sets/types";
import type { FilterSortState } from "@/hooks/useUrlState";
import type { BinaryVoteScope, VoteScope } from "@/lib/voteScope";

const NO_MEMBERS = new Set<string>();

interface FilteredSetsPanelProps {
  sets: FestivalSet[];
  urlState: FilterSortState;
  updateUrlState: (updates: Partial<FilterSortState>) => void;
  clearFilters: () => void;
  editionId: string;
}

export function FilteredSetsPanel(props: FilteredSetsPanelProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <>
        <FilterSortControls
          state={props.urlState}
          onStateChange={props.updateUrlState}
          onClear={props.clearFilters}
          editionId={props.editionId}
        />
        <div className="mt-8">
          <SetsPanelContent
            sets={props.sets}
            urlState={props.urlState}
            updateUrlState={props.updateUrlState}
            voteScope="everyone"
            groupMemberIds={NO_MEMBERS}
          />
        </div>
      </>
    );
  }

  return <AuthedFilteredSetsPanel {...props} userId={user.id} />;
}

// Preference between "everyone" and "group"; the active scope used for
// filtering falls back to "everyone" whenever there is no active Group in
// the header's current scope (including when it's pinned/overridden to Me,
// which isn't a meaningful Vote Perspective on this tab).
function AuthedFilteredSetsPanel(
  props: FilteredSetsPanelProps & { userId: string },
) {
  const { current, groups } = useActiveScope();
  const activeGroupId = current.kind === "group" ? current.groupId : undefined;
  const activeGroupName = activeGroupId
    ? groups.find((group) => group.id === activeGroupId)?.name
    : undefined;
  const [perspective, setPerspective] = useState<BinaryVoteScope>("group");

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
          <SetsPanelContent
            sets={props.sets}
            urlState={props.urlState}
            updateUrlState={props.updateUrlState}
            voteScope="everyone"
            groupMemberIds={NO_MEMBERS}
          />
        )}
      </div>
    </>
  );
}

function GroupScopedSetsPanel({
  sets,
  urlState,
  updateUrlState,
  groupId,
}: Pick<FilteredSetsPanelProps, "sets" | "urlState" | "updateUrlState"> & {
  groupId: string;
}) {
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
      voteScope="group"
      groupMemberIds={groupMemberIds}
    />
  );
}

function SetsPanelContent({
  sets,
  urlState,
  updateUrlState,
  voteScope,
  groupMemberIds,
}: Pick<FilteredSetsPanelProps, "sets" | "urlState" | "updateUrlState"> & {
  voteScope: VoteScope;
  groupMemberIds: Set<string>;
}) {
  const { filteredAndSortedSets, lockCurrentOrder } = useSetFiltering(
    sets,
    urlState,
    voteScope,
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
