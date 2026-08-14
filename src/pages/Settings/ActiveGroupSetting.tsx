import { Users } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useActiveScope } from "@/contexts/ActiveScopeContext";

export function ActiveGroupSetting() {
  const { groups, activeGroupId, setActiveGroup } = useActiveScope();

  return (
    <div>
      <h2 className="text-sm font-semibold text-white">Active group</h2>
      <p className="mb-3 text-xs text-purple-300">
        Which of your groups is yours by default, whenever your scope is set to
        a group.
      </p>
      <ToggleGroup
        type="single"
        value={activeGroupId}
        onValueChange={(value) => {
          if (value) {
            setActiveGroup(value);
          }
        }}
        className="flex-wrap justify-start gap-2"
      >
        {groups.map((group) => (
          <ToggleGroupItem
            key={group.id}
            value={group.id}
            className="gap-1.5 rounded-md border border-purple-400/30 px-3 py-1.5 text-sm text-purple-100 data-[state=on]:border-purple-400 data-[state=on]:bg-purple-600/20 data-[state=on]:font-medium data-[state=on]:text-purple-100 hover:bg-purple-600/10"
            aria-label={`Set ${group.name} as active group`}
          >
            <Users className="h-3.5 w-3.5" />
            {group.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
