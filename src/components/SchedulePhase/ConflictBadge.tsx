import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConflictBadgeProps {
  conflictCount: number;
  size?: "sm" | "default";
  className?: string;
}

export function ConflictBadge({
  conflictCount,
  size = "sm",
  className,
}: ConflictBadgeProps) {
  if (conflictCount === 0) return null;

  return (
    <Badge
      variant="destructive"
      className={cn(
        "flex items-center gap-1",
        size === "sm" && "text-xs px-2 py-0.5",
        className,
      )}
    >
      <AlertTriangle className={cn("h-3 w-3", size === "sm" && "h-2.5 w-2.5")} />
      <span>
        {conflictCount} conflict{conflictCount > 1 ? "s" : ""}
      </span>
    </Badge>
  );
}
