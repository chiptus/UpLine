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
  const naiveUtcMs = new Date(`${dateStr}T${timeStr}:00Z`).getTime();

  // The offset can differ depending on which side of a DST transition the
  // resolved instant falls on, so sample it once at the naive guess and
  // again at the resulting instant, correcting if they disagree.
  const firstOffsetMs = offsetMsAt(naiveUtcMs, timezone);
  let utcMs = naiveUtcMs - firstOffsetMs;

  const secondOffsetMs = offsetMsAt(utcMs, timezone);
  if (secondOffsetMs !== firstOffsetMs) {
    utcMs = naiveUtcMs - secondOffsetMs;
  }

  return new Date(utcMs).toISOString();
}

function offsetMsAt(utcMs: number, timezone: string): number {
  // sv-SE locale gives "YYYY-MM-DD HH:MM:SS" — unambiguously parseable as UTC
  const wallClockMs = new Date(
    new Date(utcMs).toLocaleString("sv-SE", { timeZone: timezone }) + "Z",
  ).getTime();
  return wallClockMs - utcMs;
}

export function utcToLocalDate(utcIso: string, timezone: string): string {
  // sv-SE renders as "YYYY-MM-DD HH:MM:SS" so we can take the date portion.
  return new Date(utcIso)
    .toLocaleString("sv-SE", { timeZone: timezone })
    .split(" ")[0];
}
