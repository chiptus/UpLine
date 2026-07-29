import { formatInTimeZone } from "date-fns-tz";
import { timeToOffset } from "@/lib/timelineCalculator";

export const DAY_GAP_PX = 5;

export const UPCOMING_FADE_THRESHOLD_PX = 100;

export const DATE_LABEL_WIDTH_PX = 120;

export interface DateChange {
  date: Date;
  position: number;
}

export function computeDateChanges(
  timeSlots: Date[],
  timezone: string,
): DateChange[] {
  return timeSlots.reduce((changes, timeSlot, index) => {
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
  }, [] as DateChange[]);
}

export interface DateLabelGeometry {
  currentDate: DateChange;
  nextDate: DateChange | null;
  currentDayEndPosition: number;
  currentDateStickyLeft: number;
  currentDateOpacity: number;
  shouldShowUpcoming: boolean;
  nextDateOpacity: number;
}

/**
 * Computes the pinned/fading date-label positions for the current scroll offset.
 * @param scrollLeft Keeps the current day's label pinned to the strip's left
 * edge while scrolling through that day, fading in the next day's label
 * as its boundary nears.
 */
export function computeDateLabelGeometry(
  dateChanges: DateChange[],
  scrollLeft: number,
  totalWidth: number,
): DateLabelGeometry {
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
    Math.max(0, currentDayWidth - DATE_LABEL_WIDTH_PX),
  );

  return {
    currentDate,
    nextDate,
    currentDayEndPosition,
    currentDateStickyLeft,
    currentDateOpacity: scrollLeft - currentDate.position >= 0 ? 1 : 0,
    shouldShowUpcoming,
    nextDateOpacity: shouldShowUpcoming
      ? Math.min(1, (UPCOMING_FADE_THRESHOLD_PX - distanceToNextDay) / 50)
      : 0,
  };
}
