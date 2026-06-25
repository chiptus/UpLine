import { FestivalSet } from "@/api/sets/types";

import { EmptyArtistsState } from "./EmptyArtistsState";
import { FestivalSetProvider } from "./FestivalSetContext";
import { SetListItem } from "./SetListItem";

export function SetsPanel({
  sets,
  use24Hour,
  onLockSort,
}: {
  sets: Array<FestivalSet>;
  use24Hour: boolean;
  onLockSort: () => void;
}) {
  if (sets.length === 0) {
    return <EmptyArtistsState />;
  }

  return (
    <div className="space-y-4" data-testid="artists-list">
      {sets.map((set) => (
        <FestivalSetProvider
          key={set.id}
          set={set}
          onLockSort={onLockSort}
          use24Hour={use24Hour}
        >
          <SetListItem />
        </FestivalSetProvider>
      ))}
    </div>
  );
}
