import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { BinaryVoteScope } from "@/lib/voteScope";

interface VotePerspectiveToggleProps {
  scope: BinaryVoteScope;
  onScopeChange: (scope: BinaryVoteScope) => void;
  groupName: string;
}

export function VotePerspectiveToggle({
  scope,
  onScopeChange,
  groupName,
}: VotePerspectiveToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={scope}
      onValueChange={(value) => {
        if (value === "everyone" || value === "group") {
          onScopeChange(value);
        }
      }}
      className="rounded-md border p-0.5"
    >
      <ToggleGroupItem
        value="everyone"
        size="sm"
        className="text-subtle-foreground data-[state=on]:bg-accent-soft data-[state=on]:text-foreground"
        aria-label="Rate by everyone's votes"
      >
        Everyone
      </ToggleGroupItem>
      <ToggleGroupItem
        value="group"
        size="sm"
        className="text-subtle-foreground data-[state=on]:bg-accent-soft data-[state=on]:text-foreground"
        aria-label={`Rate by ${groupName}'s votes`}
      >
        {groupName}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
