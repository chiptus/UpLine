import { Users } from "lucide-react";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import { SettingsToggleItem } from "@/pages/Settings/SettingsToggleItem";

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
          <SettingsToggleItem
            key={group.id}
            value={group.id}
            ariaLabel={`Set ${group.name} as active group`}
          >
            <Users className="h-3.5 w-3.5" />
            {group.name}
          </SettingsToggleItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
