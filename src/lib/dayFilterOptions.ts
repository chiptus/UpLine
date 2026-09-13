import { format, isValid, parseISO } from "date-fns";

export interface DayFilterOption {
  value: string;
  label: string;
}

/**
 * One option per calendar day the edition runs, plus one extra leading day
 * when `dayStartHour` is set: a festival day starting before midnight can
 * fold a pre-cutoff set on the edition's first calendar day back onto the
 * previous day's key, so that day needs to be offered too.
 */
export function buildDayFilterOptions(
  startDateStr: string | null | undefined,
  endDateStr: string | null | undefined,
  dayStartHour: number = 0,
): DayFilterOption[] {
  if (!startDateStr || !endDateStr) return [];

  const startDate = parseISO(startDateStr);
  const endDate = parseISO(endDateStr);
  if (!isValid(startDate) || !isValid(endDate)) return [];

  const currentDate = new Date(startDate);
  if (dayStartHour) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  const options: DayFilterOption[] = [];
  while (currentDate <= endDate) {
    options.push({
      value: format(currentDate, "yyyy-MM-dd"),
      label: format(currentDate, "EEEE"), // e.g., "Friday"
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return options;
}
