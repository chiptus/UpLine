import { useId, useState } from "react";
import { ChevronsUpDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTimezoneCatalog } from "./timezoneCatalog";
import { TimezoneItem } from "./TimezoneItem";

type Props = {
  value: string;
  onChange: (value: string) => void;
  description?: string;
};

export function TimezonePicker({
  value,
  onChange,
  description = "All times in the CSV are interpreted as local festival time.",
}: Props) {
  const triggerId = useId();
  const [open, setOpen] = useState(false);

  const { groups, byZone } = useTimezoneCatalog();
  const selected = byZone.get(value);

  function handleSelect(zone: string) {
    onChange(zone);
    setOpen(false);
  }

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
            className="w-80 justify-between font-normal group"
          >
            <span className="flex items-center gap-2 truncate">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent-foreground" />
              {selected ? (
                <>
                  <span className="truncate">{selected.zone}</span>
                  <span className="ml-1 text-xs text-muted-foreground group-hover:text-accent-foreground tabular-nums">
                    {selected.offsetLabel}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground group-hover:text-accent-foreground">
                  Select timezone…
                </span>
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
                    <TimezoneItem
                      key={tz.zone}
                      tz={tz}
                      selected={value === tz.zone}
                      onSelect={handleSelect}
                    />
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
