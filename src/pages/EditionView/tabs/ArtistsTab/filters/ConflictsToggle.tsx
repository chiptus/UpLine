import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConflictsToggleProps {
  showConflictsOnly: boolean;
  onToggle: (value: boolean) => void;
  conflictCount?: number;
  disabled?: boolean;
}

export function ConflictsToggle({
  showConflictsOnly,
  onToggle,
  conflictCount = 0,
  disabled = false,
}: ConflictsToggleProps) {
  return (
    <Button
      variant={showConflictsOnly ? "default" : "outline"}
      size="sm"
      onClick={() => onToggle(!showConflictsOnly)}
      disabled={disabled || conflictCount === 0}
      className={cn(
        "flex items-center gap-2",
        showConflictsOnly && "bg-destructive hover:bg-destructive/90",
      )}
    >
      <AlertTriangle className="h-4 w-4" />
      <span className="hidden sm:inline">
        Conflicts Only {conflictCount > 0 && `(${conflictCount})`}
      </span>
      <span className="sm:hidden">Conflicts</span>
    </Button>
  );
}
