import { AuthedFilteredSetsPanel } from "@/pages/EditionView/tabs/VoteTab/AuthedFilteredSetsPanel";
import { EveryoneSetsPanel } from "@/pages/EditionView/tabs/VoteTab/SetsPanelContent";
import { FilterSortControls } from "@/pages/EditionView/tabs/VoteTab/filters/FilterSortControls";
import { useAuth } from "@/contexts/AuthContext";
import type { FestivalSet } from "@/api/sets/types";
import type { FilterSortState } from "@/hooks/useUrlState";

export interface FilteredSetsPanelProps {
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
          <EveryoneSetsPanel
            sets={props.sets}
            urlState={props.urlState}
            updateUrlState={props.updateUrlState}
          />
        </div>
      </>
    );
  }

  return <AuthedFilteredSetsPanel {...props} userId={user.id} />;
}
