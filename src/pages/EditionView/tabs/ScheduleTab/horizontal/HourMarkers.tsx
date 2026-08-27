import { formatInTimeZone } from "date-fns-tz";
import { timeToOffset } from "@/lib/timelineCalculator";
import { useTimeFormat } from "@/hooks/useTimeFormat";

interface HourMarkersProps {
  timeSlots: Date[];
  timezone: string;
}

export function HourMarkers({ timeSlots, timezone }: HourMarkersProps) {
  const use24Hour = useTimeFormat();
  const hourFormat = use24Hour ? "HH:mm" : "h a";

  return (
    <div className="hour-markers relative h-10">
      {timeSlots.map((timeSlot, index) => {
        // The first/last marker's label would otherwise overhang past the
        // scrollable range's true edge and get clipped there; growing it
        // inward instead keeps the tick itself pinned to its real offset.
        const edgeAlignment =
          index === 0
            ? "items-start"
            : index === timeSlots.length - 1
              ? "items-end"
              : "items-center";

        return (
          <div
            key={index}
            className={`absolute flex flex-col ${edgeAlignment}`}
            style={{
              left: `${timeToOffset(timeSlot, timeSlots[0])}px`,
              width: 0,
            }}
          >
            <div className="text-sm font-medium text-subtle-foreground whitespace-nowrap">
              {formatInTimeZone(timeSlot, timezone, hourFormat)}
            </div>
            <div className="w-px h-4 bg-border" />
          </div>
        );
      })}
    </div>
  );
}
