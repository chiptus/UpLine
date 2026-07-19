import { format, isValid, parseISO, isSameDay } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export function formatTimeRange(
  startTime: string | null,
  endTime: string | null,
  use24Hour: boolean = false,
  timezone?: string,
): string | null {
  if (!startTime && !endTime) return null;

  const start = startTime ? parseISO(startTime) : null;
  const end = endTime ? parseISO(endTime) : null;

  // Validate dates
  const validStart = start && isValid(start) ? start : null;
  const validEnd = end && isValid(end) ? end : null;

  if (!validStart && !validEnd) return null;

  const timeFormat = use24Hour ? "HH:mm" : "h:mm a";
  const dateTimeFormat = use24Hour ? "MMM d, HH:mm" : "MMM d, h:mm a";

  function formatWith(date: Date, dateFormat: string) {
    return timezone
      ? formatInTimeZone(date, timezone, dateFormat)
      : format(date, dateFormat);
  }

  // Only start time
  if (validStart && !validEnd) {
    return `Starts: ${formatWith(validStart, dateTimeFormat)}`;
  }

  // Only end time
  if (!validStart && validEnd) {
    return `Ends: ${formatWith(validEnd, dateTimeFormat)}`;
  }

  // Both times
  if (validStart && validEnd) {
    if (isSameDay(validStart, validEnd)) {
      // Same day: "Dec 15, 2:00 PM - 4:00 PM" or "Dec 15, 14:00 - 16:00"
      return `${formatWith(validStart, dateTimeFormat)} - ${formatWith(
        validEnd,
        timeFormat,
      )}`;
    } else {
      // Different days: "Dec 15, 2:00 PM - Dec 16, 1:00 AM" or "Dec 15, 14:00 - Dec 16, 01:00"
      return `${formatWith(validStart, dateTimeFormat)} - ${formatWith(
        validEnd,
        dateTimeFormat,
      )}`;
    }
  }

  return null;
}

export function formatDateTime(
  dateTime: string | null,
  use24Hour: boolean = false,
  timezone?: string,
): string | null {
  if (!dateTime) return null;

  const date = parseISO(dateTime);
  if (!isValid(date)) return null;

  const dateTimeFormat = use24Hour ? "MMM d, HH:mm" : "MMM d, h:mm a";
  if (timezone) return formatInTimeZone(date, timezone, dateTimeFormat);
  return format(date, dateTimeFormat);
}

export function formatTimeOnly(
  startTime: string | null,
  endTime: string | null,
  use24Hour: boolean = false,
  timezone?: string,
): string | null {
  if (!startTime) return null;

  const start = parseISO(startTime);
  const end = endTime ? parseISO(endTime) : null;

  if (!isValid(start)) return null;

  const timeFormat = use24Hour ? "HH:mm" : "h:mm a";
  function formatTime(date: Date) {
    return timezone
      ? formatInTimeZone(date, timezone, timeFormat)
      : format(date, timeFormat);
  }

  if (end && isValid(end)) {
    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  return formatTime(start);
}

// Get user's timezone
function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Helper function to convert UTC ISO string to local datetime-local format
export function toDatetimeLocal(isoString: string | null): string {
  if (!isoString) return "";
  const utcDate = new Date(isoString);
  const userTimeZone = getUserTimeZone();
  const localDate = toZonedTime(utcDate, userTimeZone);

  // Format the date in local timezone for datetime-local input
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  const hours = String(localDate.getHours()).padStart(2, "0");
  const minutes = String(localDate.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Helper function to convert local datetime-local to UTC ISO string
export function toISOString(datetimeLocal: string): string {
  return convertLocalTimeToUTC(datetimeLocal, getUserTimeZone()) || "";
}

// Festival-timezone variant of toDatetimeLocal: UTC ISO string -> datetime-local
// wall-clock string in an explicit IANA zone, instead of the browser's zone.
export function toDatetimeLocalInTimeZone(
  isoString: string | null,
  timezone: string,
): string {
  if (!isoString) return "";
  const utcDate = new Date(isoString);
  if (!isValid(utcDate)) return "";
  return formatInTimeZone(utcDate, timezone, "yyyy-MM-dd'T'HH:mm");
}

export function combineDateAndTime(
  dateString: string | undefined,
  timeString: string | undefined,
): string | null {
  if (!dateString || !timeString) return null;

  const datePart = dateString.trim();
  let timePart = timeString.trim();

  // Normalize time format: ensure HH:MM format (pad single digit hours)
  // Match formats like "8:00", "08:00", "8:00:00", "08:00:00"
  const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, "0");
    const minutes = timeMatch[2];
    const seconds = timeMatch[3] || "00";
    timePart = `${hours}:${minutes}:${seconds}`;
  }

  return `${datePart} ${timePart}`;
}

export function formatDayOnly(
  dateTime: string | null,
  timezone?: string,
): string | null {
  if (!dateTime) return null;
  const date = parseISO(dateTime);
  if (!isValid(date)) return null;
  const dayFormat = "EEE, MMM d";
  if (timezone) return formatInTimeZone(date, timezone, dayFormat);
  return format(date, dayFormat);
}

// The festival calendar day (yyyy-MM-dd) a UTC timestamp falls on, computed in
// the festival's own timezone so a post-midnight set groups under the
// festival's day rather than the viewer's.
export function getFestivalDayKey(
  dateTime: string | null,
  timezone?: string,
): string | null {
  if (!dateTime) return null;
  const date = parseISO(dateTime);
  if (!isValid(date)) return null;
  if (timezone) return formatInTimeZone(date, timezone, "yyyy-MM-dd");
  return format(date, "yyyy-MM-dd");
}

// Human-readable label for a day-key produced by getFestivalDayKey.
export function getFestivalDayLabel(dayKey: string | null): string | null {
  if (!dayKey) return null;
  const date = parseISO(dayKey);
  if (!isValid(date)) return null;
  return format(date, "EEEE, MMM d");
}

// Short weekday + date label, e.g. "Thu 13"; the date disambiguates repeated
// weekday names at multi-weekend festivals.
export function getFestivalDayShortLabel(dayKey: string | null): string | null {
  if (!dayKey) return null;
  const date = parseISO(dayKey);
  if (!isValid(date)) return null;
  return format(date, "EEE d");
}

// The wall-clock hour (0-23) a UTC timestamp falls on in the festival's
// timezone, for time-of-day filters (morning/afternoon/evening).
export function getFestivalHour(
  dateTime: string | null,
  timezone?: string,
): number | null {
  if (!dateTime) return null;
  const date = parseISO(dateTime);
  if (!isValid(date)) return null;
  if (timezone) return Number(formatInTimeZone(date, timezone, "H"));
  return date.getHours();
}

export function convertLocalTimeToUTC(
  timeString: string | undefined,
  timezone: string,
): string | null {
  if (!timeString) return null;

  try {
    const utcDate = fromZonedTime(timeString, timezone);

    if (!isValid(utcDate)) {
      return null;
    }

    return utcDate.toISOString();
  } catch {
    return null;
  }
}
