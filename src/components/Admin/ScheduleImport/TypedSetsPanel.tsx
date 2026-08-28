import { ArrowRight, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SetType } from "@/api/sets/types";
import { cn } from "@/lib/utils";
import { getSetTypeLabel } from "@/lib/setTypeLabels";
import { type DiffResult } from "@/services/scheduleImport/types";

type TypedSet = {
  key: string;
  name: string;
  setType: SetType;
  previousSetType: SetType | null;
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
              {isTypeChange(set) && (
                <>
                  <SetTypeChip setType={set.previousSetType} />
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </>
              )}
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

/**
 * A stored type differing from the incoming one is the change worth
 * verifying; a set that was still untyped just gets its first type.
 */
function isTypeChange(set: TypedSet): boolean {
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

function collectTypedSets(diff: DiffResult): TypedSet[] {
  const creates = diff.cleanOperations.setsToCreate.flatMap(
    (s, i): TypedSet[] =>
      s.setType === null
        ? []
        : [
            {
              key: `create-${i}-${s.name}`,
              name: s.name,
              setType: s.setType,
              previousSetType: null,
              operation: "create",
            },
          ],
  );
  const updates = diff.cleanOperations.setsToUpdate.flatMap((s): TypedSet[] =>
    s.setType === null
      ? []
      : [
          {
            key: `update-${s.id}`,
            name: s.name,
            setType: s.setType,
            previousSetType: s.previousSetType,
            operation: "update",
          },
        ],
  );
  return [...creates, ...updates];
}
