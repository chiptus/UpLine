import {
  ChevronDown,
  Globe,
  Settings,
  Star,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import { cn } from "@/lib/utils";
import type { PinnedScope } from "@/lib/activeGroup";
import type { Group } from "@/api/groups/types";

interface ActiveGroupSwitcherProps {
  isMobile: boolean;
  className: string;
}

function scopeKey(scope: PinnedScope): string {
  return scope.kind === "group" ? `group:${scope.groupId}` : scope.kind;
}

function scopeLabel(scope: PinnedScope, groups: Group[]): string {
  if (scope.kind === "everyone") {
    return "Everyone";
  }
  if (scope.kind === "me") {
    return "Me";
  }
  return groups.find((group) => group.id === scope.groupId)?.name ?? "Group";
}

function scopeIcon(scope: PinnedScope) {
  if (scope.kind === "everyone") {
    return Globe;
  }
  if (scope.kind === "me") {
    return UserIcon;
  }
  return Users;
}

export function ActiveGroupSwitcher({
  isMobile,
  className,
}: ActiveGroupSwitcherProps) {
  const {
    groups,
    pinned,
    current,
    isOverridden,
    selectScope,
    returnToDefault,
  } = useActiveScope();

  const CurrentIcon = scopeIcon(current);
  const currentLabel = scopeLabel(current, groups);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className={className}
            aria-label={isMobile ? `Active scope: ${currentLabel}` : undefined}
          >
            <CurrentIcon className="h-4 w-4" />
            {!isMobile && (
              <span className="ml-2 flex items-center gap-1">
                {currentLabel}
                <ChevronDown className="h-3 w-3" />
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-800 border-purple-400/30">
          <ScopeMenuBody
            groups={groups}
            pinned={pinned}
            current={current}
            onSelect={selectScope}
          />
          <DropdownMenuSeparator className="bg-purple-400/30" />
          <DropdownMenuItem
            asChild
            className="text-purple-100 hover:bg-purple-600/30"
          >
            <Link to="/groups">
              <Settings className="h-4 w-4 mr-2" />
              Manage groups
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isOverridden && (
        <Button
          variant="ghost"
          size="sm"
          onClick={returnToDefault}
          aria-label={`Back to ${scopeLabel(pinned, groups)}`}
          className="gap-1 text-purple-300 hover:text-white hover:bg-purple-600/30"
        >
          <X className="h-3.5 w-3.5" />
          {!isMobile && <span>back to {scopeLabel(pinned, groups)}</span>}
        </Button>
      )}
    </div>
  );
}

/**
 * Pinned entry always sorts first (starred), so reverting to it never
 * requires hunting through the list; then remaining groups, then Everyone/Me.
 */
function ScopeMenuBody({
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
  function Row({ scope, label }: { scope: PinnedScope; label: string }) {
    const Icon = scopeIcon(scope);
    const isPinned = scopeKey(scope) === scopeKey(pinned);
    const isActive = scopeKey(scope) === scopeKey(current);
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

  const pinnedGroupId = pinned.kind === "group" ? pinned.groupId : undefined;
  const otherGroups = groups.filter((group) => group.id !== pinnedGroupId);
  const otherScopeKinds = (["everyone", "me"] as const).filter(
    (kind) => pinned.kind !== kind,
  );

  return (
    <>
      <Row scope={pinned} label={scopeLabel(pinned, groups)} />
      <DropdownMenuSeparator className="bg-purple-400/30" />
      {otherGroups.map((group) => (
        <Row
          key={group.id}
          scope={{ kind: "group", groupId: group.id }}
          label={group.name}
        />
      ))}
      {otherGroups.length > 0 && otherScopeKinds.length > 0 && (
        <DropdownMenuSeparator className="bg-purple-400/30" />
      )}
      {otherScopeKinds.map((kind) => (
        <Row
          key={kind}
          scope={{ kind }}
          label={kind === "everyone" ? "Everyone" : "Me"}
        />
      ))}
    </>
  );
}
