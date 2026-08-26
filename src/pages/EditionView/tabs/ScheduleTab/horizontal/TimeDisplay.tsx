import { Clock } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { formatTimeOnly } from "@/lib/timeUtils";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { useMemo } from "react";

interface TimeDisplayProps {
  startTime: Date;
  endTime: Date;
  timezone: string;
}

function formatCompactTime(
  startTime: Date,
  endTime: Date,
  use24Hour: boolean,
  timezone: string,
): string {
  const hourFormat = use24Hour ? "H" : "h a";
  const hourMinuteFormat = use24Hour ? "H:mm" : "h:mm a";

  const startMinutes = Number(formatInTimeZone(startTime, timezone, "m"));
  const endMinutes = Number(formatInTimeZone(endTime, timezone, "m"));

  const startStr =
    startMinutes === 0
      ? formatInTimeZone(startTime, timezone, hourFormat)
      : formatInTimeZone(startTime, timezone, hourMinuteFormat);
  const endStr =
    endMinutes === 0
      ? formatInTimeZone(endTime, timezone, hourFormat)
      : formatInTimeZone(endTime, timezone, hourMinuteFormat);

  return `${startStr}-${endStr}`;
}

export function TimeDisplay({
  startTime,
  endTime,
  timezone,
}: TimeDisplayProps) {
  const use24Hour = useTimeFormat();
  const useCompact = useMemo(() => {
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    return duration <= 60;
  }, [startTime, endTime]);

  return (
    <div className="flex items-center gap-1">
      <Clock className="h-3 w-3 flex-shrink-0" />
      <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">
        {useCompact
          ? formatCompactTime(startTime, endTime, use24Hour, timezone)
          : formatTimeOnly(
              startTime.toISOString(),
              endTime.toISOString(),
              use24Hour,
              timezone,
            )}
      </span>
    </div>
  );
}
