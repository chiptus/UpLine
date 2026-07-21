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
        <Clock className="h-3 w-3 text-purple-300" />
        <label className="text-sm font-medium text-purple-200">Time</label>
      </div>
      <Select value={selectedTime} onValueChange={onTimeChange}>
        <SelectTrigger
          data-testid="time-filter-trigger"
          className="bg-white/10 border-purple-400/30 text-purple-100"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-purple-400/30">
          <SelectItem value="all" className="text-purple-100">
            All Day
          </SelectItem>
          <SelectItem value="morning" className="text-purple-100">
            Morning (6-12)
          </SelectItem>
          <SelectItem value="afternoon" className="text-purple-100">
            Afternoon (12-18)
          </SelectItem>
          <SelectItem value="evening" className="text-purple-100">
            Evening (18-24)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
