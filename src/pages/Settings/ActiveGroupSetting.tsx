import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
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
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-purple-100 transition-colors",
              activeGroupId === group.id
                ? "border-purple-400 bg-purple-600/20 font-medium"
                : "border-purple-400/30 hover:bg-purple-600/10",
            )}
          >
            <Users className="h-3.5 w-3.5" />
            {group.name}
          </button>
        ))}
      </div>
    </div>
  );
}
