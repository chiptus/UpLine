import { Clock } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { formatTimeOnly } from "@/lib/timeUtils";
import { useMemo } from "react";

interface TimeDisplayProps {
  startTime: Date;
  endTime: Date;
  timezone: string;
}

function formatCompactTime(
  startTime: Date,
  endTime: Date,
  timezone: string,
): string {
  const startHour = formatInTimeZone(startTime, timezone, "H");
  const endHour = formatInTimeZone(endTime, timezone, "H");

  const startMinutes = Number(formatInTimeZone(startTime, timezone, "m"));
  const endMinutes = Number(formatInTimeZone(endTime, timezone, "m"));

  const startStr =
    startMinutes === 0 ? startHour : formatInTimeZone(startTime, timezone, "H:mm");
  const endStr =
    endMinutes === 0 ? endHour : formatInTimeZone(endTime, timezone, "H:mm");

  return `${startStr}-${endStr}`;
}

export function TimeDisplay({ startTime, endTime, timezone }: TimeDisplayProps) {
  const useCompact = useMemo(() => {
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    return duration <= 60;
  }, [startTime, endTime]);

  return (
    <div className="flex items-center gap-1">
      <Clock className="h-3 w-3 flex-shrink-0" />
      <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">
        {useCompact
          ? formatCompactTime(startTime, endTime, timezone)
          : formatTimeOnly(
              startTime.toISOString(),
              endTime.toISOString(),
              true,
              timezone,
            )}
      </span>
    </div>
  );
}
