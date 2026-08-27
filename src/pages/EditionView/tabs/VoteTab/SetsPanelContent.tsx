import { SetsPanel } from "@/pages/EditionView/tabs/VoteTab/SetsPanel";
import { useSetFiltering } from "@/pages/EditionView/tabs/VoteTab/useSetFiltering";
import type { FestivalSet } from "@/api/sets/types";
import type { FilterSortState } from "@/hooks/useUrlState";
import type { VoteScope } from "@/lib/voteScope";

export const NO_MEMBERS = new Set<string>();

export interface SetsPanelInputs {
  sets: FestivalSet[];
  urlState: FilterSortState;
  updateUrlState: (updates: Partial<FilterSortState>) => void;
}

export function SetsPanelContent({
  sets,
  urlState,
  updateUrlState,
  voteScope,
  groupMemberIds,
}: SetsPanelInputs & { voteScope: VoteScope; groupMemberIds: Set<string> }) {
  const { filteredAndSortedSets, lockCurrentOrder } = useSetFiltering(
    sets,
    urlState,
    voteScope,
    groupMemberIds,
  );

  return (
    <SetsPanel
      sets={filteredAndSortedSets}
      onLockSort={() => lockCurrentOrder(updateUrlState)}
    />
  );
}

export function EveryoneSetsPanel(props: SetsPanelInputs) {
  return (
    <SetsPanelContent
      {...props}
      voteScope="everyone"
      groupMemberIds={NO_MEMBERS}
    />
  );
}
