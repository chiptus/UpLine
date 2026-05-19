import { useMemo } from "react";
import { ZONE_COUNTRIES } from "./zoneCountries";

export type TzInfo = {
  zone: string;
  region: string;
  city: string;
  primaryCountry: string;
  offsetLabel: string;
  offsetMinutes: number;
  abbreviation: string;
  searchValue: string;
};

export type TzGroup = {
  region: string;
  zones: TzInfo[];
};

const FALLBACK_ZONES = [
  "UTC",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
];

export function useTimezoneCatalog(): {
  groups: TzGroup[];
  byZone: Map<string, TzInfo>;
} {
  return useMemo(() => {
    const now = new Date();
    const zones = listZones();
    const countryNames = makeCountryNameResolver();

    const entries: TzInfo[] = zones.map((zone) =>
      buildEntry(zone, now, countryNames),
    );

    entries.sort((a, b) => {
      if (a.region !== b.region) return a.region.localeCompare(b.region);
      if (a.offsetMinutes !== b.offsetMinutes)
        return a.offsetMinutes - b.offsetMinutes;
      return a.city.localeCompare(b.city);
    });

    const byZone = new Map<string, TzInfo>();
    const grouped = new Map<string, TzInfo[]>();
    for (const entry of entries) {
      byZone.set(entry.zone, entry);
      const bucket = grouped.get(entry.region) ?? [];
      bucket.push(entry);
      grouped.set(entry.region, bucket);
    }

    const groups: TzGroup[] = Array.from(grouped.entries()).map(
      ([region, list]) => ({ region, zones: list }),
    );

    return { groups, byZone };
  }, []);
}

function listZones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      // fall through
    }
  }
  return FALLBACK_ZONES;
}

function buildEntry(
  zone: string,
  now: Date,
  countryNames: (code: string) => string,
): TzInfo {
  const firstSlash = zone.indexOf("/");
  // Group by the top-level path segment (America/Argentina/Buenos_Aires
  // rolls up into "America", not its own "America/Argentina" group).
  const region = firstSlash >= 0 ? zone.slice(0, firstSlash) : "Other";
  const rawCity = firstSlash >= 0 ? zone.slice(firstSlash + 1) : zone;
  const city = rawCity.replace(/_/g, " ");

  const offsetLabel = formatOffset(zone, now);
  const offsetMinutes = parseOffsetMinutes(offsetLabel);
  const abbreviation = formatAbbreviation(zone, now);

  // Country lookup: first code is the primary (shown in the row); all codes
  // contribute resolved names to the search index so a zone shared by
  // multiple countries (Europe/Berlin → DE, DK, NO, SE, …) matches any of them.
  const countryCodes = ZONE_COUNTRIES[zone] ?? [];
  const countryAllNames = countryCodes
    .map((code) => countryNames(code))
    .filter(Boolean);
  const primaryCountry = countryAllNames[0] ?? "";

  const offsetCondensed = offsetLabel.replace(/[^+\-0-9]/g, "");
  const searchValue = [
    zone,
    city,
    region,
    abbreviation,
    offsetLabel,
    offsetCondensed,
    ...countryAllNames,
    ...countryCodes,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    zone,
    region,
    city,
    primaryCountry,
    offsetLabel,
    offsetMinutes,
    abbreviation,
    searchValue,
  };
}

function makeCountryNameResolver(): (code: string) => string {
  let formatter: Intl.DisplayNames | null = null;
  try {
    formatter = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    // Older runtimes without DisplayNames — fall back to returning the code.
  }
  return (code) => {
    if (!formatter) return code;
    try {
      return formatter.of(code) ?? code;
    } catch {
      return code;
    }
  };
}

function formatOffset(zone: string, now: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longOffset",
    }).formatToParts(now);
    const raw =
      parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
    // "GMT+01:00" -> "UTC+01:00"; bare "GMT" -> "UTC+00:00"
    return raw === "GMT" ? "UTC+00:00" : raw.replace(/^GMT/, "UTC");
  } catch {
    return "UTC+00:00";
  }
}

function parseOffsetMinutes(offsetLabel: string): number {
  const match = offsetLabel.match(/([+-])(\d{1,2}):(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

function formatAbbreviation(zone: string, now: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "short",
    }).formatToParts(now);
    const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    // Drop generic "GMT+1" abbreviations — those duplicate the offset column.
    return /^GMT[+-]/.test(raw) ? "" : raw;
  } catch {
    return "";
  }
}
