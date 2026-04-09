import { FilterSortControls } from "./filters/FilterSortControls";
import { useSetFiltering } from "./useSetFiltering";
import { useUrlState } from "@/hooks/useUrlState";
import { SetsPanel } from "./SetsPanel";
import { useSetsByEditionQuery } from "@/hooks/queries/sets/useSetsByEdition";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";

export function ArtistsTab() {
  const { state: urlState, updateUrlState, clearFilters } = useUrlState();
  const { edition, festival } = useFestivalEdition();

  // Fetch sets for the current edition
  const { data: sets = [], isLoading: setsLoading } = useSetsByEditionQuery(
    edition?.id,
  );
  const { filteredAndSortedSets, lockCurrentOrder } = useSetFiltering(
    sets || [],
    urlState,
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
          <SetsPanel
            sets={filteredAndSortedSets}
            use24Hour={urlState.use24Hour}
            onLockSort={() => lockCurrentOrder(updateUrlState)}
          />
        </div>
      </div>
    </>
  );
}
