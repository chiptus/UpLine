import { ArrowRight, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SetType } from "@/api/sets/types";
import { cn } from "@/lib/utils";
import { getSetTypeLabel } from "@/lib/setTypeLabels";
import { formatDateTime } from "@/lib/timeUtils";
import { type DiffResult } from "@/services/scheduleImport/types";
import {
  getFieldChanges,
  type FieldChange,
  type FieldKey,
} from "@/services/scheduleImport/setFieldChanges";

type Props = {
  setsToCreate: DiffResult["cleanOperations"]["setsToCreate"];
  setsToUpdate: DiffResult["cleanOperations"]["setsToUpdate"];
  timezone: string;
};

const FIELD_LABELS: Record<FieldKey, string> = {
  name: "Name",
  stage: "Stage",
  timeStart: "Start",
  timeEnd: "End",
  type: "Type",
  description: "Description",
};

export function SetChangesPanel({
  setsToCreate,
  setsToUpdate,
  timezone,
}: Props) {
  const changed = setsToUpdate
    .map((set) => ({ set, changes: getFieldChanges(set) }))
    .filter(({ changes }) => changes.length > 0);
  const anyTyped =
    setsToCreate.some((s) => s.setType !== null) ||
    setsToUpdate.some((s) => s.setType !== null);

  if (changed.length === 0 && !anyTyped) return null;

  const unchangedCount = setsToUpdate.length - changed.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Pencil className="h-4 w-4 text-muted-foreground" />
        {changed.length > 0
          ? `${changed.length} existing set${changed.length !== 1 ? "s" : ""} changing`
          : "No changes to existing sets"}
      </div>

      <p className="text-xs text-muted-foreground">
        {unchangedCount > 0 &&
          `${unchangedCount} matched ${unchangedCount !== 1 ? "sets are" : "set is"} identical to what is stored. `}
        Rows with a blank type keep whatever type the matched set already has.
      </p>

      {changed.length > 0 && (
        <div className="divide-y rounded-lg border">
          {changed.map(({ set, changes }) => (
            <div key={set.id} className="space-y-1 px-4 py-2">
              <p className="text-sm font-medium truncate">
                {set.previous.name}
              </p>
              {changes.map((change) => (
                <ChangeRow
                  key={change.field}
                  change={change}
                  timezone={timezone}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeRow({
  change,
  timezone,
}: {
  change: FieldChange;
  timezone: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 text-muted-foreground">
        {FIELD_LABELS[change.field]}
      </span>
      <Value change={change} value={change.stored} timezone={timezone} />
      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
      <Value change={change} value={change.incoming} timezone={timezone} />
    </div>
  );
}

function Value({
  change,
  value,
  timezone,
}: {
  change: FieldChange;
  value: string | null;
  timezone: string;
}) {
  if (change.field === "type") {
    return <SetTypeChip setType={value as SetType | null} />;
  }
  const text =
    change.field === "timeStart" || change.field === "timeEnd"
      ? formatDateTime(value, { timezone })
      : value;
  if (!text) {
    return <span className="italic text-muted-foreground">none</span>;
  }
  return <span className="truncate">{text}</span>;
}

function SetTypeChip({ setType }: { setType: SetType | null }) {
  if (setType === null) {
    return (
      <Badge variant="outline" className="shrink-0 text-muted-foreground">
        No type
      </Badge>
    );
  }
  const { icon: Icon, label, color } = getSetTypeLabel(setType);
  return (
    <Badge variant="secondary" className="gap-1 shrink-0">
      <Icon className={cn("h-3 w-3", color)} />
      {label}
    </Badge>
  );
}
