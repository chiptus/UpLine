import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const DEFAULT_DAY_END_HOUR = 0;

interface DayEndHourFieldProps {
  value: number;
  onChange: (hour: number) => void;
}

export function DayEndHourField({ value, onChange }: DayEndHourFieldProps) {
  return (
    <div>
      <Label htmlFor="dayEndHour">Day end hour</Label>
      <Input
        id="dayEndHour"
        type="number"
        min={0}
        max={23}
        value={value}
        onChange={(e) => onChange(clampHour(Number(e.target.value)))}
      />
      <p className="text-sm text-muted-foreground mt-1">
        The hour (in the festival timezone) the festival day ends. Sets before
        it belong to the previous day. 0 ends days at midnight.
      </p>
    </div>
  );
}

function clampHour(hour: number): number {
  if (Number.isNaN(hour)) return DEFAULT_DAY_END_HOUR;
  return Math.min(23, Math.max(0, Math.trunc(hour)));
}
