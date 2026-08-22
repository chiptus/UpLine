import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useRouteContext } from "@tanstack/react-router";
import { format, parseISO, isValid } from "date-fns";

interface DayFilterSelectProps {
  selectedDay: string;
  onDayChange: (day: string) => void;
}

export function DayFilterSelect({
  selectedDay,
  onDayChange,
}: DayFilterSelectProps) {
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });

  // Generate day options from edition dates
  const dayOptions = [];
  dayOptions.push({ value: "all", label: "All Days" });

  if (edition?.start_date && edition?.end_date) {
    const startDate = parseISO(edition.start_date);
    const endDate = parseISO(edition.end_date);

    if (isValid(startDate) && isValid(endDate)) {
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const dayLabel = format(currentDate, "EEEE"); // e.g., "Friday"
        dayOptions.push({
          value: dateStr,
          label: dayLabel,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Calendar className="h-3 w-3 text-subtle-foreground" />
        <label className="text-sm font-medium text-muted-foreground">Day</label>
      </div>
      <Select value={selectedDay} onValueChange={onDayChange}>
        <SelectTrigger
          data-testid="day-filter-trigger"
          className="bg-surface-raised border-border text-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {dayOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-foreground"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
