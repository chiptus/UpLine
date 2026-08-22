import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import type { TimeFilter } from "@/hooks/useTimelineUrlState";

interface TimeFilterSelectProps {
  selectedTime: TimeFilter;
  onTimeChange: (time: TimeFilter) => void;
}

export function TimeFilterSelect({
  selectedTime,
  onTimeChange,
}: TimeFilterSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="h-3 w-3 text-subtle-foreground" />
        <label className="text-sm font-medium text-muted-foreground">
          Time
        </label>
      </div>
      <Select value={selectedTime} onValueChange={onTimeChange}>
        <SelectTrigger
          data-testid="time-filter-trigger"
          className="bg-surface-raised border-border text-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all" className="text-foreground">
            All Day
          </SelectItem>
          <SelectItem value="morning" className="text-foreground">
            Morning (6-12)
          </SelectItem>
          <SelectItem value="afternoon" className="text-foreground">
            Afternoon (12-18)
          </SelectItem>
          <SelectItem value="evening" className="text-foreground">
            Evening (18-24)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
