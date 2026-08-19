import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { MeGroupVoteScope } from "@/lib/voteScope";

interface VoteScopeToggleProps {
  scope: MeGroupVoteScope;
  onScopeChange: (scope: MeGroupVoteScope) => void;
  groupName: string;
}

export function VoteScopeToggle({
  scope,
  onScopeChange,
  groupName,
}: VoteScopeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={scope}
      onValueChange={(value) => {
        if (value === "me" || value === "group") {
          onScopeChange(value);
        }
      }}
      className="rounded-md border border-purple-400/30 p-0.5"
    >
      <ToggleGroupItem
        value="me"
        size="sm"
        className="text-purple-300 data-[state=on]:bg-purple-600/30 data-[state=on]:text-purple-100"
        aria-label="Filter by my votes"
      >
        Me
      </ToggleGroupItem>
      <ToggleGroupItem
        value="group"
        size="sm"
        className="text-purple-300 data-[state=on]:bg-purple-600/30 data-[state=on]:text-purple-100"
        aria-label={`Filter by ${groupName}'s votes`}
      >
        {groupName}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
