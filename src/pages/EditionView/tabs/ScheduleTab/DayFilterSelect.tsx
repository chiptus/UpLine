import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useRouteContext } from "@tanstack/react-router";
import { buildDayFilterOptions } from "@/lib/dayFilterOptions";

interface DayFilterSelectProps {
  selectedDay: string;
  onDayChange: (day: string) => void;
}

export function DayFilterSelect({
  selectedDay,
  onDayChange,
}: DayFilterSelectProps) {
  const { festival, edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });

  const dayOptions = [
    { value: "all", label: "All Days" },
    ...buildDayFilterOptions(
      edition?.start_date,
      edition?.end_date,
      festival?.day_start_hour,
    ),
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Calendar className="h-3 w-3 text-subtle-foreground" />
        <label className="text-sm font-medium text-muted-foreground">Day</label>
      </div>
      <Select value={selectedDay} onValueChange={onDayChange}>
        <SelectTrigger
          data-testid="day-filter-trigger"
          className="bg-surface-raised border-border text-popover-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {dayOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-popover-foreground"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
