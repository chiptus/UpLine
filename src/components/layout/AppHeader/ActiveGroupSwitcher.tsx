import { ChevronDown, Settings, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSetActiveGroupMutation } from "@/api/groups/useSetActiveGroupMutation";
import { cn } from "@/lib/utils";
import type { Group } from "@/api/groups/types";

interface ActiveGroupSwitcherProps {
  isMobile: boolean;
  userId: string;
  activeGroupId: string | undefined;
  activeGroup: Group | undefined;
  groups: Group[];
  className: string;
}

export function ActiveGroupSwitcher({
  isMobile,
  userId,
  activeGroupId,
  activeGroup,
  groups,
  className,
}: ActiveGroupSwitcherProps) {
  const setActiveGroupMutation = useSetActiveGroupMutation();

  function handleSelect(groupId: string | null) {
    if (groupId === (activeGroupId ?? null)) {
      return;
    }
    setActiveGroupMutation.mutate({ userId, groupId });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className={className}
          aria-label={
            isMobile
              ? `Active group: ${activeGroup?.name || "Everyone"}`
              : undefined
          }
        >
          <Users className="h-4 w-4" />
          {!isMobile && (
            <span className="ml-2 flex items-center gap-1">
              {activeGroup?.name || "Everyone"}
              <ChevronDown className="h-3 w-3" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-purple-400/30">
        <DropdownMenuItem
          onClick={() => handleSelect(null)}
          className={cn(
            "text-purple-100 hover:bg-purple-600/30",
            !activeGroupId && "bg-purple-600/20",
          )}
        >
          Everyone
        </DropdownMenuItem>
        {groups.map((group) => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => handleSelect(group.id)}
            className={cn(
              "text-purple-100 hover:bg-purple-600/30",
              activeGroupId === group.id && "bg-purple-600/20",
            )}
          >
            {group.name}
          </DropdownMenuItem>
        ))}
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
  );
}
