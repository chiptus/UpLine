import { FilterSortControls } from "./filters/FilterSortControls";
import { useSetFiltering } from "./useSetFiltering";
import { useUrlState } from "@/hooks/useUrlState";
import { SetsPanel } from "./SetsPanel";
import { useSetsByEditionQuery } from "@/hooks/queries/sets/useSetsByEdition";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";
import { useSchedulePhase } from "@/hooks/useSchedulePhase";
import { SchedulePhaseIndicator } from "@/components/SchedulePhase/SchedulePhaseIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useUserVotes } from "@/hooks/queries/voting/useUserVotes";
import { useSetConflicts } from "@/hooks/useSetConflicts";
import { useMemo } from "react";

export function ArtistsTab() {
  const { state: urlState, updateUrlState, clearFilters } = useUrlState();
  const { edition, festival } = useFestivalEdition();
  const { user } = useAuth();

  const { data: sets = [], isLoading: setsLoading } = useSetsByEditionQuery(
    edition?.id,
  );

  const phaseInfo = useSchedulePhase(sets);

  const { data: userVotes } = useUserVotes(user?.id);

  const userVotedSetIds = useMemo(() => {
    if (!userVotes) return [];
    return Object.keys(userVotes);
  }, [userVotes]);

  const conflicts = useSetConflicts(sets, userVotedSetIds);

  const { filteredAndSortedSets, lockCurrentOrder } = useSetFiltering(
    sets || [],
    urlState,
    conflicts.allConflicts,
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
        <div className="mb-4">
          <SchedulePhaseIndicator phaseInfo={phaseInfo} />
        </div>

        <FilterSortControls
          state={urlState}
          onStateChange={updateUrlState}
          onClear={clearFilters}
          editionId={edition?.id || ""}
          conflictCount={conflicts.allConflicts.size}
          showConflictsToggle={phaseInfo.phase === "post-schedule"}
        />

        <div className="mt-8">
          <SetsPanel
            sets={filteredAndSortedSets}
            use24Hour={urlState.use24Hour}
            onLockSort={() => lockCurrentOrder(updateUrlState)}
            conflicts={conflicts.allConflicts}
            phaseInfo={phaseInfo}
          />
        </div>
      </div>
    </>
  );
}
