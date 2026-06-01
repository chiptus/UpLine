import { FilterSortControls } from "./filters/FilterSortControls";
import { useSetFiltering } from "./useSetFiltering";
import { useUrlState } from "@/hooks/useUrlState";
import { SetsPanel } from "./SetsPanel";
import { useSetsByEditionQuery } from "@/hooks/queries/sets/useSetsByEdition";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { PageTitle } from "@/components/PageTitle/PageTitle";
import { useMemo } from "react";
import { maskSetForReveal } from "@/lib/scheduleReveal";

export function ArtistsTab() {
  const { state: urlState, updateUrlState, clearFilters } = useUrlState();
  const { edition, festival } = useFestivalEdition();
  const { level } = useScheduleReveal();

  // Fetch sets for the current edition
  const { data: sets = [], isLoading: setsLoading } = useSetsByEditionQuery(
    edition?.id,
  );
  const maskedSets = useMemo(
    () => (sets ?? []).map((s) => maskSetForReveal(s, level)),
    [sets, level],
  );
  const { filteredAndSortedSets, lockCurrentOrder } = useSetFiltering(
    maskedSets,
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
