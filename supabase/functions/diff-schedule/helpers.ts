import { TZDate } from "npm:@date-fns/tz@1.5.0";
import md5 from "npm:blueimp-md5@2.19.0";

/**
 * Mirrors `generateSlug` in `src/lib/slug.ts` and Postgres' `public.slugify()`
 * (the `slugify_non_empty_fallback` migration) — keep all three in sync.
 * Falls back to a deterministic hash-based slug when there are no ASCII
 * alphanumerics to keep, since diff-schedule precomputes slugs the commit
 * step looks rows up by.
 */
export function toSlug(name: string): string {
  const normalized = name.toLowerCase().trim();
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return slug === "" ? `n-${md5(normalized).slice(0, 8)}` : slug;
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
