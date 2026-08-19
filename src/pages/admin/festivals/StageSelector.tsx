import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStagesByEditionQuery } from "@/api/stages/useStagesByEdition";

export function StageSelector({
  value,
  onValueChange,
  editionId,
}: {
  editionId: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
}) {
  const { data: stages = [], isLoading } = useStagesByEditionQuery(editionId);

  return (
    <div className="space-y-2">
      <Label htmlFor="stage">Stage</Label>
      <Select
        {...(value !== undefined ? { value } : {})}
        onValueChange={onValueChange}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={isLoading ? "Loading stages..." : "Select a stage"}
          />
        </SelectTrigger>
        <SelectContent>
          {stages.map((stage) => (
            <SelectItem key={stage.id} value={stage.id}>
              {stage.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
