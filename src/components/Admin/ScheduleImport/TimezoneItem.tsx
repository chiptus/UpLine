import { Check } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { TzInfo } from "./timezoneCatalog";

type Props = {
  tz: TzInfo;
  selected: boolean;
  onSelect: (zone: string) => void;
};

export function TimezoneItem({ tz, selected, onSelect }: Props) {
  return (
    <CommandItem value={tz.searchValue} onSelect={() => onSelect(tz.zone)}>
      <Check
        className={cn(
          "mr-2 h-4 w-4 shrink-0",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {tz.city}
          {tz.primaryCountry && (
            <span className="font-normal text-muted-foreground">
              {" · "}
              {tz.primaryCountry}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">{tz.zone}</div>
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
  );
}
