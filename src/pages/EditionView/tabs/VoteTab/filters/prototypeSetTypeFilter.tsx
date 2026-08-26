// PROTOTYPE (issue #400) — throwaway. Three variants of a set-type filter for
// the vote tab, switchable via ?variant= (A|B|C). set_type doesn't exist in the
// data yet, so a fake type is derived deterministically from the set id.
// Remove this file (and its wiring) once a variant wins.
import { Music, Hammer, Drama, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterSortState } from "@/hooks/useUrlState";

export const SET_TYPES = [
  { id: "music", label: "Music", icon: Music },
  { id: "workshop", label: "Workshop", icon: Hammer },
  { id: "performance", label: "Performance", icon: Drama },
  { id: "other", label: "Other", icon: Sparkles },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  icon: LucideIcon;
}>;

export function fakeSetType(setId: string): string {
  let hash = 0;
  for (let i = 0; i < setId.length; i++) {
    hash = (hash * 31 + setId.charCodeAt(i)) | 0;
  }
  // Weighted so most sets stay music, like a real lineup
  const bucket = Math.abs(hash) % 10;
  if (bucket < 6) return "music";
  if (bucket < 8) return "workshop";
  if (bucket < 9) return "performance";
  return "other";
}

interface TypeFilterProps {
  state: FilterSortState;
  onStateChange: (updates: Partial<FilterSortState>) => void;
}

function toggleType(
  state: FilterSortState,
  onStateChange: (updates: Partial<FilterSortState>) => void,
  typeId: string,
) {
  const next = state.types.includes(typeId)
    ? state.types.filter((t) => t !== typeId)
    : [...state.types, typeId];
  onStateChange({ types: next });
}

// Variant A: "Chip row" — always-visible labeled chips directly under the
// sort bar, outside the expandable filter panel. Types are first-class.
export function TypeFilterVariantA({ state, onStateChange }: TypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SET_TYPES.map((type) => {
        const active = state.types.includes(type.id);
        return (
          <Button
            key={type.id}
            variant={active ? "default" : "outline"}
            size="sm"
            onClick={() => toggleType(state, onStateChange, type.id)}
            className={cn(
              "gap-1.5",
              active
                ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                : "border-ring text-ring hover:bg-ring hover:text-foreground",
            )}
          >
            <type.icon className="h-3.5 w-3.5" />
            {type.label}
          </Button>
        );
      })}
    </div>
  );
}

// Variant B: "Filter section" — a Type section inside the expandable filter
// panel, alongside Stages/Genres/Rating. Types are just another filter.
export function TypeFilterVariantB({ state, onStateChange }: TypeFilterProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Type</h4>
      <div className="flex flex-wrap gap-2">
        {SET_TYPES.map((type) => {
          const active = state.types.includes(type.id);
          return (
            <Button
              key={type.id}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => toggleType(state, onStateChange, type.id)}
              className={cn(
                "gap-1.5",
                active
                  ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                  : "border-ring text-ring hover:bg-ring hover:text-foreground",
              )}
            >
              <type.icon className="h-3.5 w-3.5" />
              {type.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Variant C: "Top-bar icons" — compact icon-only toggle group squeezed into
// the sort bar itself, next to the filter toggle. Zero vertical cost.
export function TypeFilterVariantC({ state, onStateChange }: TypeFilterProps) {
  return (
    <div className="flex items-center rounded-md border border-border overflow-hidden">
      {SET_TYPES.map((type) => {
        const active = state.types.includes(type.id);
        return (
          <button
            key={type.id}
            type="button"
            title={type.label}
            aria-pressed={active}
            onClick={() => toggleType(state, onStateChange, type.id)}
            className={cn(
              "p-2 transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <type.icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
