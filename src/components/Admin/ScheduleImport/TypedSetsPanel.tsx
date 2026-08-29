import { ArrowRight, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SetType } from "@/api/sets/types";
import { cn } from "@/lib/utils";
import { getSetTypeLabel } from "@/lib/setTypeLabels";
import { type DiffResult } from "@/services/scheduleImport/types";

type SetToUpdate = DiffResult["cleanOperations"]["setsToUpdate"][number];

type Props = {
  setsToCreate: DiffResult["cleanOperations"]["setsToCreate"];
  setsToUpdate: DiffResult["cleanOperations"]["setsToUpdate"];
};

export function TypedSetsPanel({ setsToCreate, setsToUpdate }: Props) {
  const typedCreateCount = setsToCreate.filter(
    (s) => s.setType !== null,
  ).length;
  const typedUpdates = setsToUpdate.filter((s) => s.setType !== null);
  const typeChanges = typedUpdates.filter(isTypeChange);
  const firstTypeCount = typedUpdates.filter(
    (s) => s.previousSetType === null,
  ).length;
  const noopCount =
    typedCreateCount +
    typedUpdates.length -
    typeChanges.length -
    firstTypeCount;

  if (typedCreateCount + typedUpdates.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Tags className="h-4 w-4 text-muted-foreground" />
        {typeChanges.length > 0
          ? `${typeChanges.length} set${typeChanges.length !== 1 ? "s" : ""} changing type`
          : "Set types from the CSV"}
      </div>

      <p className="text-xs text-muted-foreground">
        {firstTypeCount > 0 &&
          `${firstTypeCount} existing ${firstTypeCount !== 1 ? "sets get their" : "set gets its"} first type from the CSV. `}
        {noopCount > 0 &&
          `${noopCount} ${noopCount !== 1 ? "rows carry" : "row carries"} a type that changes nothing (new sets, or updates matching the stored type). `}
        Rows with a blank type keep whatever type the matched set already has.
      </p>

      {typeChanges.length > 0 && (
        <div className="divide-y rounded-lg border">
          {typeChanges.map((set) => (
            <div
              key={set.id}
              className="flex items-center justify-between px-4 py-2"
            >
              <p className="text-sm font-medium truncate">{set.name}</p>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <SetTypeChip setType={set.previousSetType} />
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <SetTypeChip setType={set.setType} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A stored type overwritten by a different one is the change worth listing
 * per set; first-time types (null stored) and new sets are only counted.
 */
function isTypeChange(set: SetToUpdate): boolean {
  return set.previousSetType !== null && set.previousSetType !== set.setType;
}

function SetTypeChip({ setType }: { setType: SetType | null }) {
  const { icon: Icon, label, color } = getSetTypeLabel(setType);
  return (
    <Badge variant="secondary" className="gap-1 shrink-0">
      <Icon className={cn("h-3 w-3", color)} />
      {label}
    </Badge>
  );
}
