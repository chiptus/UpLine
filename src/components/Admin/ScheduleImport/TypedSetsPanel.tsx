import { Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSetTypeLabel } from "@/lib/setTypeLabels";
import {
  type DiffResult,
  type SetPayload,
} from "@/services/scheduleImport/types";

type TypedSet = {
  key: string;
  name: string;
  setType: string;
  operation: "create" | "update";
};

type Props = { diff: DiffResult };

export function TypedSetsPanel({ diff }: Props) {
  const typedSets = collectTypedSets(diff);
  if (typedSets.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Tags className="h-4 w-4 text-muted-foreground" />
        {typedSets.length} set{typedSets.length !== 1 ? "s" : ""} with a type
        from the CSV
      </div>

      <p className="text-xs text-muted-foreground">
        These rows carry a <code>Type</code> value that will be written on
        commit. Rows with a blank type keep whatever type the matched set
        already has.
      </p>

      <div className="divide-y rounded-lg border">
        {typedSets.map((set) => (
          <div
            key={set.key}
            className="flex items-center justify-between px-4 py-2"
          >
            <p className="text-sm font-medium truncate">{set.name}</p>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <SetTypeChip setType={set.setType} />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {set.operation === "create" ? "new" : "update"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SetTypeChip({ setType }: { setType: string }) {
  const typeLabel = getSetTypeLabel(setType);
  return (
    <Badge variant="secondary" className="gap-1 shrink-0">
      <typeLabel.icon className={`h-3 w-3 ${typeLabel.color}`} />
      {typeLabel.label}
    </Badge>
  );
}

function collectTypedSets(diff: DiffResult): TypedSet[] {
  function typed(
    sets: SetPayload[],
    operation: TypedSet["operation"],
  ): TypedSet[] {
    return sets
      .filter((s) => s.setType !== null)
      .map((s, i) => ({
        key: `${operation}-${i}-${s.name}`,
        name: s.name,
        setType: s.setType as string,
        operation,
      }));
  }
  return [
    ...typed(diff.cleanOperations.setsToCreate, "create"),
    ...typed(diff.cleanOperations.setsToUpdate, "update"),
  ];
}
