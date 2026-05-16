import { useId, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

type TzInfo = {
  zone: string;
  region: string;
  city: string;
  offsetLabel: string;
  offsetMinutes: number;
  abbreviation: string;
  searchValue: string;
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

export function TimezonePicker({ value, onChange }: Props) {
  const triggerId = useId();
  const [open, setOpen] = useState(false);

  const { groups, byZone } = useTimezoneCatalog();
  const selected = byZone.get(value);

  return (
    <div className="space-y-2">
      <Label htmlFor={triggerId}>Timezone</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-80 justify-between font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              {selected ? (
                <>
                  <span className="truncate">{selected.zone}</span>
                  <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                    {selected.offsetLabel}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Select timezone…</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search city, region, offset…" />
            <CommandList className="max-h-80">
              <CommandEmpty>No matching timezone.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.region} heading={group.region}>
                  {group.zones.map((tz) => (
                    <CommandItem
                      key={tz.zone}
                      value={tz.searchValue}
                      onSelect={() => {
                        onChange(tz.zone);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === tz.zone ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {tz.city}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {tz.zone}
                        </div>
                      </div>
                      <div className="ml-2 flex flex-col items-end shrink-0">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {tz.offsetLabel}
                        </span>
                        {tz.abbreviation && (
                          <span className="text-[10px] text-muted-foreground/80">
                            {tz.abbreviation}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground">
        All times in the CSV are interpreted as local festival time.
      </p>
    </div>
  );
}

function useTimezoneCatalog() {
  return useMemo(() => {
    const now = new Date();
    const zones = listZones();

    const entries: TzInfo[] = zones.map((zone) => buildEntry(zone, now));

    // Sort within each region by offset, then city.
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

    const groups = Array.from(grouped.entries()).map(([region, list]) => ({
      region,
      zones: list,
    }));

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

function buildEntry(zone: string, now: Date): TzInfo {
  const firstSlash = zone.indexOf("/");
  // Group by the top-level path segment (America/Argentina/Buenos_Aires
  // rolls up into "America", not its own "America/Argentina" group).
  const region = firstSlash >= 0 ? zone.slice(0, firstSlash) : "Other";
  const rawCity = firstSlash >= 0 ? zone.slice(firstSlash + 1) : zone;
  const city = rawCity.replace(/_/g, " ");

  const offsetLabel = formatOffset(zone, now);
  const offsetMinutes = parseOffsetMinutes(offsetLabel);
  const abbreviation = formatAbbreviation(zone, now);

  // Concatenate every term cmdk should match against. Include the
  // condensed offset ("+0100") so people can type "+01" and find it.
  const offsetCondensed = offsetLabel.replace(/[^+\-0-9]/g, "");
  const searchValue = [
    zone,
    city,
    region,
    abbreviation,
    offsetLabel,
    offsetCondensed,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    zone,
    region,
    city,
    offsetLabel,
    offsetMinutes,
    abbreviation,
    searchValue,
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
    const normalized = raw === "GMT" ? "UTC+00:00" : raw.replace(/^GMT/, "UTC");
    return normalized;
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
    // Drop the generic "GMT+1" abbreviations — those duplicate the offset column.
    return /^GMT[+-]/.test(raw) ? "" : raw;
  } catch {
    return "";
  }
}
