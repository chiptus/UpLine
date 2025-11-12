import { TableCell } from "@/components/ui/table";
import { Link2 } from "lucide-react";
import type { MatchingSet } from "@/services/csv/setMatcher";

interface MatchingSetCellProps {
  matchingSet: MatchingSet | null;
  isLoading: boolean;
}

export function MatchingSetCell({
  matchingSet,
  isLoading,
}: MatchingSetCellProps) {
  if (isLoading) {
    return (
      <TableCell>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </TableCell>
    );
  }

  if (!matchingSet) {
    return (
      <TableCell>
        <div className="text-sm text-muted-foreground">No match</div>
      </TableCell>
    );
  }

  return (
    <TableCell>
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm">
          <Link2 className="h-3 w-3 text-green-600" />
          <span className="font-medium">
            {matchingSet.name || "Unnamed Set"}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {matchingSet.stage_name && <div>Stage: {matchingSet.stage_name}</div>}
          <div>
            {matchingSet.vote_count}{" "}
            {matchingSet.vote_count === 1 ? "vote" : "votes"}
          </div>
        </div>
      </div>
    </TableCell>
  );
}
