import { formatInTimeZone } from "date-fns-tz";
import { timeToOffset } from "@/lib/timelineCalculator";

interface TimeScaleProps {
  timeSlots: Date[];
  totalWidth: number;
  timezone: string;
}

const dateFormat = "MMMM d";

// Pure layout of the canvas at `totalWidth` — the parent (TimelineContainer)
// hosts it inside a sticky, horizontally-synced strip.
export function TimeScale({ timeSlots, totalWidth, timezone }: TimeScaleProps) {
  const dateChanges = timeSlots.reduce(
    (changes, timeSlot, index) => {
      if (index === 0) {
        changes.push({ date: timeSlot, position: 0 });
        return changes;
      }
      const prevDate = formatInTimeZone(
        timeSlots[index - 1],
        timezone,
        "yyyy-MM-dd",
      );
      const currentDate = formatInTimeZone(timeSlot, timezone, "yyyy-MM-dd");
      if (prevDate !== currentDate) {
        changes.push({
          date: timeSlot,
          position: timeToOffset(timeSlot, timeSlots[0]),
        });
      }
      return changes;
    },
    [] as Array<{ date: Date; position: number }>,
  );

  return (
    <div className="relative" style={{ minWidth: totalWidth }}>
      <div className="flex-1 relative h-8">
        {dateChanges.map((dateChange, index) => {
          const nextDateChange = dateChanges[index + 1];
          const width = nextDateChange
            ? nextDateChange.position - dateChange.position
            : totalWidth - dateChange.position;

          return (
            <div
              key={`date-${index}`}
              className="absolute top-0 h-full flex items-center bg-purple-800 px-3 text-sm font-semibold text-white whitespace-nowrap"
              style={{ left: `${dateChange.position}px`, width: `${width}px` }}
            >
              {formatInTimeZone(dateChange.date, timezone, dateFormat)}
            </div>
          );
        })}
      </div>

      <div className="hour-markers relative h-10">
        {timeSlots.map((timeSlot, index) => (
          <div
            key={index}
            className="absolute flex flex-col items-center"
            style={{ left: `${timeToOffset(timeSlot, timeSlots[0])}px` }}
          >
            <div className="text-sm font-medium text-purple-300">
              {formatInTimeZone(timeSlot, timezone, "HH:mm")}
            </div>
            <div className="w-px h-4 bg-purple-400/30" />
          </div>
        ))}
      </div>
    </div>
  );
}
