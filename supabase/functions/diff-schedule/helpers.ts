import { TZDate } from "npm:@date-fns/tz@1.5.0";

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function artistKey(slugs: string[]): string {
  return [...slugs].sort().join("|");
}

export function advanceDateByOne(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}

export function localToUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const zoned = new TZDate(year, month - 1, day, hour, minute, 0, timezone);
  return new Date(+zoned).toISOString();
}

export function utcToLocalDate(utcIso: string, timezone: string): string {
  // sv-SE renders as "YYYY-MM-DD HH:MM:SS" so we can take the date portion.
  return new Date(utcIso)
    .toLocaleString("sv-SE", { timeZone: timezone })
    .split(" ")[0];
}
