import { formatInTimeZone } from "date-fns-tz";
import { timeToOffset } from "@/lib/timelineCalculator";

interface TimeScaleProps {
  timeSlots: Date[];
  totalWidth: number;
  timezone: string;
  scrollLeft: number;
}

const dateFormat = "MMMM d";

// Width of the day-boundary gap between adjacent date backgrounds.
const DAY_GAP_PX = 5;

// Distance (px) from the next day boundary at which its label starts fading in.
const UPCOMING_FADE_THRESHOLD_PX = 100;

// `scrollLeft` keeps the current day's label pinned to the strip's left
// edge while scrolling through that day, fading in the next day's label
// as its boundary nears.
export function TimeScale({
  timeSlots,
  totalWidth,
  timezone,
  scrollLeft,
}: TimeScaleProps) {
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

  const currentDateIndex = dateChanges.findLastIndex(
    (change) => change.position <= scrollLeft,
  );
  const currentDate =
    currentDateIndex >= 0 ? dateChanges[currentDateIndex] : dateChanges[0];
  const nextDate =
    currentDateIndex >= 0 && currentDateIndex < dateChanges.length - 1
      ? dateChanges[currentDateIndex + 1]
      : null;

  const currentDayEndPosition = nextDate
    ? nextDate.position - DAY_GAP_PX
    : totalWidth;
  const currentDayWidth = currentDayEndPosition - currentDate.position;
  const distanceToNextDay = nextDate
    ? nextDate.position - scrollLeft
    : Infinity;
  const shouldShowUpcoming =
    nextDate !== null && distanceToNextDay <= UPCOMING_FADE_THRESHOLD_PX;

  // Pinned label stays within its own day block: not before the day starts,
  // not past the day's end (leaving room for the label's own width).
  const currentDateStickyLeft = Math.min(
    Math.max(0, scrollLeft - currentDate.position),
    Math.max(0, currentDayWidth - 120),
  );

  return (
    <div className="relative" style={{ minWidth: totalWidth }}>
      <div className="relative h-8">
        {dateChanges.map((dateChange, index) => {
          const nextDateChange = dateChanges[index + 1];
          const fullWidth = nextDateChange
            ? nextDateChange.position - dateChange.position
            : totalWidth - dateChange.position;
          const width = fullWidth - DAY_GAP_PX;

          return (
            <div
              key={`date-bg-${index}`}
              className="absolute top-0 h-full bg-purple-900/60 border border-purple-400/30"
              style={{
                left: `${dateChange.position}px`,
                width: `${width}px`,
              }}
            />
          );
        })}

        <div
          className="absolute top-0 z-10 flex h-full items-center px-3 text-sm font-medium text-purple-100 whitespace-nowrap"
          style={{
            left: `${currentDate.position + currentDateStickyLeft}px`,
            opacity: scrollLeft - currentDate.position >= 0 ? 1 : 0,
          }}
        >
          {formatInTimeZone(currentDate.date, timezone, dateFormat)}
        </div>

        {shouldShowUpcoming && nextDate && (
          <div
            className="absolute top-0 z-10 flex h-full items-center px-3 text-sm font-medium text-purple-50 whitespace-nowrap"
            style={{
              left: `${nextDate.position}px`,
              opacity: Math.min(
                1,
                (UPCOMING_FADE_THRESHOLD_PX - distanceToNextDay) / 50,
              ),
            }}
          >
            {formatInTimeZone(nextDate.date, timezone, dateFormat)}
          </div>
        )}
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
