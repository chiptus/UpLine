import { Button } from "@/components/ui/button";
import { SET_TYPES, type SetType } from "@/api/sets/types";
import { setTypeLabels } from "@/lib/setTypeLabels";
import { cn } from "@/lib/utils";
import type { FilterSortState } from "@/hooks/useUrlState";

interface SetTypeFilterProps {
  state: FilterSortState;
  onStateChange: (updates: Partial<FilterSortState>) => void;
}

export function SetTypeFilter({ state, onStateChange }: SetTypeFilterProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Type</h4>
      <div className="flex flex-wrap gap-2">
        {SET_TYPES.map((type) => {
          const { label, icon: Icon } = setTypeLabels[type];
          const active = state.types.includes(type);
          return (
            <Button
              key={type}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeToggle(type)}
              className={cn(
                "gap-1.5",
                active
                  ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                  : "border-ring text-ring hover:bg-ring hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );

  function handleTypeToggle(type: SetType) {
    const types = state.types.includes(type)
      ? state.types.filter((t) => t !== type)
      : [...state.types, type];
    onStateChange({ types });
  }
}
