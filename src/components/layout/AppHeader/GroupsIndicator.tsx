import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { UserPlus, Users, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveGroup } from "@/hooks/useActiveGroup";
import { useSetActiveGroupMutation } from "@/api/groups/useSetActiveGroupMutation";
import { cn } from "@/lib/utils";
import { TooltipButton } from "./TooltipButton";

const groupsButtonClassName =
  "bg-transparent border-purple-400/50 text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-colors";

export function GroupsIndicator({ isMobile }: { isMobile: boolean }) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <Skeleton
          className={cn(
            "bg-purple-400/20",
            isMobile ? "h-9 w-9 rounded-md" : "h-10 w-32 rounded-md",
          )}
        />
      }
    >
      <GroupsIndicatorContent isMobile={isMobile} userId={user.id} />
    </Suspense>
  );
}

function GroupsIndicatorContent({
  isMobile,
  userId,
}: {
  isMobile: boolean;
  userId: string;
}) {
  const { activeGroup, activeGroupId, groups, hasGroups } =
    useActiveGroup(userId);
  const setActiveGroupMutation = useSetActiveGroupMutation();

  if (!hasGroups) {
    return (
      <Link to="/groups">
        <TooltipButton
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className={groupsButtonClassName}
          tooltip="Create or join a group to start sharing votes"
          isMobile={isMobile}
          aria-label={isMobile ? "Create/Join a Group" : undefined}
        >
          <UserPlus className="h-4 w-4" />
          {!isMobile && <span className="ml-2">Create/Join a Group</span>}
        </TooltipButton>
      </Link>
    );
  }

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
          className={groupsButtonClassName}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
