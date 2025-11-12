import { TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { MatchingSet } from "@/services/csv/setMatcher";
import type { SetSelection } from "./SetsPreviewTable";

interface SetSelectionCellProps {
  matchingSets: MatchingSet[];
  setSelection?: SetSelection;
  isLoading: boolean;
  onSetSelectionChange: (selection: SetSelection) => void;
}

export function SetSelectionCell({
  matchingSets,
  setSelection,
  isLoading,
  onSetSelectionChange,
}: SetSelectionCellProps) {
  if (isLoading) {
    return (
      <TableCell>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </TableCell>
    );
  }

  const selectedSetId = setSelection?.matchedSetId;
  const selectedAction = setSelection?.action || "create";

  function handleSetChange(setId: string) {
    if (setId === "create") {
      onSetSelectionChange({ action: "create" });
    } else {
      onSetSelectionChange({
        action: "match",
        matchedSetId: setId,
      });
    }
  }

  function handleActionChange(action: "match" | "duplicate") {
    if (!selectedSetId) return;
    onSetSelectionChange({
      action,
      matchedSetId: selectedSetId,
    });
  }

  return (
    <TableCell>
      <div className="space-y-2">
        <Select
          value={selectedSetId || "create"}
          onValueChange={handleSetChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select set action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="create">
              <span className="text-blue-600">Create new set</span>
            </SelectItem>
            {matchingSets.length > 0 && (
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Matching Sets
              </div>
            )}
            {matchingSets.map((match) => (
              <SelectItem key={match.id} value={match.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{match.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {match.stage_name && `${match.stage_name} • `}
                    {match.vote_count}{" "}
                    {match.vote_count === 1 ? "vote" : "votes"}
                    {!match.time_start && " • No hours"}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSetId && selectedSetId !== "create" && (
          <RadioGroup
            value={selectedAction}
            onValueChange={handleActionChange}
            className="space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="match" id={`match-${selectedSetId}`} />
              <Label
                htmlFor={`match-${selectedSetId}`}
                className="text-sm font-normal"
              >
                Match (update existing)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="duplicate"
                id={`duplicate-${selectedSetId}`}
              />
              <Label
                htmlFor={`duplicate-${selectedSetId}`}
                className="text-sm font-normal"
              >
                Duplicate with votes
              </Label>
            </div>
          </RadioGroup>
        )}
      </div>
    </TableCell>
  );
}
