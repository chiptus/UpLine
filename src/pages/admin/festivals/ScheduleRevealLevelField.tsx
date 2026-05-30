import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RevealLevel } from "@/lib/scheduleReveal";

type Props = {
  value: RevealLevel;
  onChange: (level: RevealLevel) => void;
  editionPublished: boolean;
};

export function ScheduleRevealLevelField({
  value,
  onChange,
  editionPublished,
}: Props) {
  return (
    <div>
      <Label htmlFor="schedule_reveal_level">Schedule reveal</Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as RevealLevel)}
      >
        <SelectTrigger id="schedule_reveal_level">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">Draft — nothing revealed</SelectItem>
          <SelectItem value="days">
            Days — date visible, stage and time hidden
          </SelectItem>
          <SelectItem value="stages">
            Stages — date and stage visible, time hidden
          </SelectItem>
          <SelectItem value="full">Full — exact times revealed</SelectItem>
        </SelectContent>
      </Select>
      {!editionPublished && value !== "draft" && (
        <p className="text-sm text-muted-foreground mt-1">
          Configured but not active — edition is not published.
        </p>
      )}
    </div>
  );
}
