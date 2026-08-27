import { SET_TYPES, type SetType } from "@/api/sets/types";
import { setTypeLabels } from "@/lib/setTypeLabels";
import { cn } from "@/lib/utils";

interface SetTypePickerProps {
  value: SetType | null;
  onPick: (setType: SetType) => void;
  label?: string;
}

export function SetTypePicker({ value, onPick, label }: SetTypePickerProps) {
  return (
    <div
      role="group"
      aria-label={label ?? "Set type"}
      className="flex flex-wrap gap-2"
    >
      {SET_TYPES.map((setType) => {
        const { label: typeLabel, icon: Icon } = setTypeLabels[setType];
        return (
          <button
            key={setType}
            type="button"
            aria-pressed={value === setType}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
              value === setType
                ? "bg-accent text-accent-foreground border-accent"
                : "hover:bg-muted",
            )}
            onClick={() => onPick(setType)}
          >
            <Icon className="h-3 w-3" />
            {typeLabel}
          </button>
        );
      })}
    </div>
  );
}
