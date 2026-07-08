import { fromZonedTime } from "npm:date-fns-tz@3.2.0";

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
  return fromZonedTime(`${dateStr}T${timeStr}:00`, timezone).toISOString();
}

export function utcToLocalDate(utcIso: string, timezone: string): string {
  // sv-SE renders as "YYYY-MM-DD HH:MM:SS" so we can take the date portion.
  return new Date(utcIso)
    .toLocaleString("sv-SE", { timeZone: timezone })
    .split(" ")[0];
}
