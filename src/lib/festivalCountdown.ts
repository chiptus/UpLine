import { differenceInCalendarDays, isValid, parseISO } from "date-fns";

export function daysUntilStart(
  startDate: string | null,
  now: Date,
): number | null {
  if (!startDate) return null;

  const start = parseISO(startDate);
  if (!isValid(start)) return null;

  return differenceInCalendarDays(start, now);
}
