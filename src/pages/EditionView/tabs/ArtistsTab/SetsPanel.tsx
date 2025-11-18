import { FestivalSet } from "@/hooks/queries/sets/useSets";
import { SchedulePhaseInfo } from "@/hooks/useSchedulePhase";
import { EmptyArtistsState } from "./EmptyArtistsState";
import { FestivalSetProvider } from "./FestivalSetContext";
import { SetListItem } from "./SetListItem";

export function SetsPanel({
  sets,
  use24Hour,
  onLockSort,
  conflicts,
  phaseInfo,
}: {
  sets: Array<FestivalSet>;
  use24Hour: boolean;
  onLockSort: () => void;
  conflicts?: Map<string, string[]>;
  phaseInfo?: SchedulePhaseInfo;
}) {
  if (sets.length === 0) {
    return <EmptyArtistsState />;
  }

  return (
    <div className="space-y-4" data-testid="artists-list">
      {sets.map((set) => {
        const conflictCount = conflicts?.get(set.id)?.length ?? 0;

        return (
          <FestivalSetProvider
            key={set.id}
            set={set}
            onLockSort={onLockSort}
            use24Hour={use24Hour}
          >
            <SetListItem
              conflictCount={conflictCount}
              showScheduleInfo={phaseInfo?.phase === "post-schedule"}
            />
          </FestivalSetProvider>
        );
      })}
    </div>
  );
}
