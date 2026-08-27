import { Button } from "@/components/ui/button";
import { SET_TYPES, type SetType } from "@/api/sets/types";
import { setTypeLabels } from "@/lib/setTypeLabels";
import { cn } from "@/lib/utils";

interface SetTypeFilterProps {
  types: SetType[];
  onChange: (types: SetType[]) => void;
}

export function SetTypeFilter({ types, onChange }: SetTypeFilterProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Type</h4>
      <div className="flex flex-wrap gap-2">
        {SET_TYPES.map((type) => {
          const { label, icon: Icon } = setTypeLabels[type];
          const active = types.includes(type);
          return (
            <Button
              key={type}
              type="button"
              aria-pressed={active}
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
    onChange(
      types.includes(type) ? types.filter((t) => t !== type) : [...types, type],
    );
  }
}
