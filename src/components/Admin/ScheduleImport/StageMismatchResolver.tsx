import { useId } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import {
  type DiffResult,
  type StageMismatchResolution,
} from "@/services/scheduleImport/types";

type Mismatch = DiffResult["conflicts"]["stageNameMismatches"][number];
type DbStage = { id: string; name: string };

type Props = {
  mismatches: Mismatch[];
  dbStages: DbStage[];
  resolutions: Record<string, StageMismatchResolution>;
  onChange: (csvValue: string, resolution: StageMismatchResolution) => void;
};

export function StageMismatchResolver({
  mismatches,
  dbStages,
  resolutions,
  onChange,
}: Props) {
  if (mismatches.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Stage name conflicts — resolve before committing
      </div>

      {mismatches.map((mismatch) => (
        <MismatchRow
          key={mismatch.csvValue}
          mismatch={mismatch}
          dbStages={dbStages}
          resolution={
            resolutions[mismatch.csvValue] ?? {
              action: "map",
              dbStageName: mismatch.closestDbValue,
            }
          }
          onChange={onChange}
        />
      ))}
    </div>
  );
}

type MismatchRowProps = {
  mismatch: Mismatch;
  dbStages: DbStage[];
  resolution: StageMismatchResolution;
  onChange: (csvValue: string, resolution: StageMismatchResolution) => void;
};

function MismatchRow({
  mismatch,
  dbStages,
  resolution,
  onChange,
}: MismatchRowProps) {
  const baseId = useId();
  const mapId = `${baseId}-map`;
  const createId = `${baseId}-create`;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm">
        CSV value:{" "}
        <code className="bg-muted px-1 rounded">{mismatch.csvValue}</code>
      </p>

      <RadioGroup
        value={resolution.action}
        onValueChange={(action) => {
          if (action === "map") {
            onChange(mismatch.csvValue, {
              action: "map",
              dbStageName: mismatch.closestDbValue,
            });
          } else {
            onChange(mismatch.csvValue, { action: "create" });
          }
        }}
        className="space-y-2"
      >
        <div className="flex items-start gap-3">
          <RadioGroupItem value="map" id={mapId} className="mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={mapId} className="cursor-pointer">
              Map to existing stage
            </Label>
            {resolution.action === "map" && (
              <Select
                value={resolution.dbStageName}
                onValueChange={(name) =>
                  onChange(mismatch.csvValue, {
                    action: "map",
                    dbStageName: name,
                  })
                }
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select stage…" />
                </SelectTrigger>
                <SelectContent>
                  {dbStages.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RadioGroupItem value="create" id={createId} />
          <Label htmlFor={createId} className="cursor-pointer">
            Create new stage{" "}
            <span className="font-normal text-muted-foreground">
              "{mismatch.csvValue}"
            </span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
