import { Users } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import { settingsToggleItemClassName } from "@/pages/Settings/settingsToggleItemClassName";

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
            className={settingsToggleItemClassName}
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
