import { differenceInMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useEffect, useState, useRef } from "react";

interface TimeScaleProps {
  timeSlots: Date[];
  totalWidth: number;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  timezone: string;
}

const dateFormat = "MMMM d";

export function TimeScale({
  timeSlots,
  totalWidth,
  scrollContainerRef,
  timezone,
}: TimeScaleProps) {
  const [scrollLeft, setScrollLeft] = useState(0);
  const timeScaleRef = useRef<HTMLDivElement>(null);

  // Find where dates change to position floating date labels
  const dateChanges = timeSlots.reduce(
    (changes, timeSlot, index) => {
      if (index === 0) {
        changes.push({ date: timeSlot, position: 0 });
      } else {
        const prevDate = formatInTimeZone(
          timeSlots[index - 1],
          timezone,
          "yyyy-MM-dd",
        );
        const currentDate = formatInTimeZone(timeSlot, timezone, "yyyy-MM-dd");
        if (prevDate !== currentDate) {
          // Position based on festival-timezone midnight of the new date
          const midnightOfNewDate = fromZonedTime(
            `${currentDate}T00:00:00`,
            timezone,
          );

          // Calculate position relative to festival start
          const festivalStart = timeSlots[0];
          const minutesFromStart = differenceInMinutes(
            midnightOfNewDate,
            festivalStart,
          );
          const position = minutesFromStart * 2 + 20; // 2px per minute

          changes.push({ date: midnightOfNewDate, position });
        }
      }
      return changes;
    },
    [] as Array<{ date: Date; position: number }>,
  );

  // Track scroll position for sticky date labels
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    function handleScroll() {
      setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
    }

    const scrollContainer = scrollContainerRef.current;
    scrollContainer.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [scrollContainerRef]);

  // Find which dates should be visible based on scroll position
  const visiblePosition = scrollLeft;

  // Find current day (the day we're currently viewing)
  const currentDateIndex = dateChanges.findLastIndex(
    (change) => change.position <= visiblePosition,
  );
  const currentDate =
    currentDateIndex >= 0 ? dateChanges[currentDateIndex] : dateChanges[0];
  const nextDate =
    currentDateIndex >= 0 && currentDateIndex < dateChanges.length - 1
      ? dateChanges[currentDateIndex + 1]
      : null;

  // Calculate positions for sticky dates
  const currentDayEndPosition = nextDate ? nextDate.position - 5 : totalWidth; // -5 for the gap
  const currentDayWidth = currentDayEndPosition - currentDate.position;
  const scrolledIntoCurrentDay = visiblePosition - currentDate.position;

  // When to show upcoming date (e.g., when within 100px of next day)
  const showUpcomingThreshold = 100;
  const distanceToNextDay = nextDate
    ? nextDate.position - visiblePosition
    : Infinity;
  const shouldShowUpcoming =
    nextDate && distanceToNextDay <= showUpcomingThreshold;

  // Position for current day label (constrained to its day block)
  const currentDateStickyLeft = Math.min(
    Math.max(0, scrollLeft - currentDate.position), // Don't go before day start
    currentDayWidth - 120, // Don't go past day end (120px for label width)
  );

  return (
    <div className="relative">
      {/* Current day sticky label - stays within its day block */}
      <div
        className="absolute top-0 z-30 text-sm font-medium px-3 py-1 rounded shadow-lg  text-purple-200 whitespace-nowrap"
        style={{
          left: `${currentDate.position + currentDateStickyLeft}px`,
          opacity: scrolledIntoCurrentDay >= 0 ? 1 : 0,
        }}
      >
        {currentDate
          ? formatInTimeZone(currentDate.date, timezone, dateFormat)
          : "Loading..."}
      </div>

      {/* Upcoming day sticky label - appears when approaching next day */}
      {shouldShowUpcoming && nextDate && (
        <div
          className="absolute top-0 z-30 text-sm font-medium px-3 py-1 rounded shadow-lg  text-purple-100 whitespace-nowrap "
          style={{
            left: `${nextDate.position}px`, // Show to the right of current view
            opacity: Math.min(
              1,
              (showUpcomingThreshold - distanceToNextDay) / 50,
            ), // Fade in effect
          }}
        >
          {formatInTimeZone(nextDate.date, timezone, dateFormat)}
        </div>
      )}

      <div
        ref={timeScaleRef}
        className="flex items-center mb-[72px] relative"
        style={{ minWidth: totalWidth }}
      >
        <div className="flex-1 relative">
          {/* Floating date labels spanning the width of each day */}
          {dateChanges.map((dateChange, index) => {
            // Calculate width from this date to the next date (or end of timeline)
            const nextDateChange = dateChanges[index + 1];
            const fullWidth = nextDateChange
              ? nextDateChange.position - dateChange.position
              : totalWidth - dateChange.position;

            const space = 5;
            const width = fullWidth - space;
            const left = dateChange.position;

            return (
              <div
                key={`date-${index}`}
                className="absolute top-0 text-sm font-medium text-purple-200 bg-purple-900/60 px-2 py-1 border border-purple-400/30 flex items-center justify-center"
                style={{
                  left: `${left}px`,
                  width: `${width}px`,
                  minWidth: "100px", // Ensure minimum readability
                }}
              >
                {/* {format(dateChange.date, dateFormat)} */}
                &nbsp;
              </div>
            );
          })}

          {/* Hour markers */}
          <div className="hour-markers">
            {timeSlots.map((timeSlot, index) => (
              <div
                key={index}
                className="absolute flex flex-col items-center"
                style={{ left: `${index * 120}px` }}
              >
                <div className="text-sm font-medium text-purple-300 mb-2 mt-10">
                  {formatInTimeZone(timeSlot, timezone, "HH:mm")}
                </div>
                <div className="w-px h-4 bg-purple-400/30"></div>
              </div>
            ))}
          </div>

          {/* Horizontal grid line */}
          <div className="absolute top-16 left-0 right-0 h-px bg-purple-400/20"></div>
        </div>
      </div>
    </div>
  );
}
