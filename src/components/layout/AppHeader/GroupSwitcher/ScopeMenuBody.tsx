import { Star } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { scopeIcon, scopeKey, scopeLabel } from "./scopeDisplay";
import type { PinnedScope } from "@/lib/activeGroup";
import type { Group } from "@/api/groups/types";

export function ScopeMenuBody({
  groups,
  pinned,
  current,
  onSelect,
}: {
  groups: Group[];
  pinned: PinnedScope;
  current: PinnedScope;
  onSelect: (scope: PinnedScope) => void;
}) {
  const pinnedGroupId = pinned.kind === "group" ? pinned.groupId : undefined;
  const otherGroups = groups.filter((group) => group.id !== pinnedGroupId);
  const otherScopeKinds = (["everyone", "me"] as const).filter(
    (kind) => pinned.kind !== kind,
  );

  return (
    <>
      <ScopeMenuRow
        scope={pinned}
        label={scopeLabel(pinned, groups)}
        isPinned={isPinned(pinned)}
        isActive={isActive(pinned)}
        onSelect={onSelect}
      />
      <DropdownMenuSeparator className="bg-purple-400/30" />
      {otherGroups.map((group) => {
        const scope: PinnedScope = { kind: "group", groupId: group.id };
        return (
          <ScopeMenuRow
            key={group.id}
            scope={scope}
            label={group.name}
            isPinned={isPinned(scope)}
            isActive={isActive(scope)}
            onSelect={onSelect}
          />
        );
      })}
      {otherGroups.length > 0 && otherScopeKinds.length > 0 && (
        <DropdownMenuSeparator className="bg-purple-400/30" />
      )}
      {otherScopeKinds.map((kind) => {
        const scope: PinnedScope = { kind };
        return (
          <ScopeMenuRow
            key={kind}
            scope={scope}
            label={kind === "everyone" ? "Everyone" : "Me"}
            isPinned={isPinned(scope)}
            isActive={isActive(scope)}
            onSelect={onSelect}
          />
        );
      })}
    </>
  );

  function isPinned(scope: PinnedScope) {
    return scopeKey(scope) === scopeKey(pinned);
  }
  function isActive(scope: PinnedScope) {
    return scopeKey(scope) === scopeKey(current);
  }
}

function ScopeMenuRow({
  scope,
  label,
  isPinned,
  isActive,
  onSelect,
}: {
  scope: PinnedScope;
  label: string;
  isPinned: boolean;
  isActive: boolean;
  onSelect: (scope: PinnedScope) => void;
}) {
  const Icon = scopeIcon(scope);
  return (
    <DropdownMenuItem
      onClick={() => onSelect(scope)}
      className={cn(
        "flex items-center gap-2 text-purple-100 hover:bg-purple-600/30",
        isActive && "bg-purple-600/20",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {isPinned && (
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      )}
    </DropdownMenuItem>
  );
}
