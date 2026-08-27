import { Tag } from "lucide-react";
import type { SetType } from "@/api/sets/types";
import type { ArtistSetWithCoPerformers } from "@/api/artists/useArtistsMissingLinksByEdition";
import { formatTimeOnly } from "@/lib/timeUtils";
import { SetTypePicker } from "./SetTypePicker";

interface UntypedSetsBlockProps {
  untypedSets: ArtistSetWithCoPerformers[];
  pendingTypes: Record<string, SetType>;
  onPick: (setId: string, setType: SetType) => void;
}

export function UntypedSetsBlock({
  untypedSets,
  pendingTypes,
  onPick,
}: UntypedSetsBlockProps) {
  const hasMultiple = untypedSets.length > 1;
  const allSameType =
    hasMultiple &&
    untypedSets.every(
      (set) => pendingTypes[set.id] === pendingTypes[untypedSets[0].id],
    )
      ? (pendingTypes[untypedSets[0].id] ?? null)
      : null;

  return (
    <div className="rounded-lg border border-dashed p-3 space-y-3">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <Tag className="h-4 w-4" />
        {hasMultiple
          ? `${untypedSets.length} sets have no type yet`
          : "This set has no type yet"}
      </p>
      {hasMultiple && (
        <div className="space-y-1 border-b pb-3">
          <p className="text-xs text-muted-foreground">Set all to:</p>
          <SetTypePicker
            label="Set all types"
            value={allSameType}
            onPick={handlePickAll}
          />
        </div>
      )}
      {untypedSets.map((set) => (
        <div key={set.id} className="space-y-1">
          {hasMultiple && (
            <p className="text-xs text-muted-foreground">
              {[
                set.name,
                set.stage_name,
                formatTimeOnly(set.time_start, set.time_end, true),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <SetTypePicker
            label={`Type for ${set.name}`}
            value={pendingTypes[set.id] ?? null}
            onPick={(setType) => onPick(set.id, setType)}
          />
        </div>
      ))}
    </div>
  );

  function handlePickAll(setType: SetType) {
    for (const set of untypedSets) {
      onPick(set.id, setType);
    }
  }
}
