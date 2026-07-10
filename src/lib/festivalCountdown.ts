import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function daysUntilStart(
  startDate: string | null,
  now: Date,
  timezone: string,
): number | null {
  if (!startDate) return null;

  const start = parseISO(startDate);
  if (!isValid(start)) return null;

  const todayInFestivalTz = parseISO(
    formatInTimeZone(now, timezone, "yyyy-MM-dd"),
  );

  return differenceInCalendarDays(start, todayInFestivalTz);
}
