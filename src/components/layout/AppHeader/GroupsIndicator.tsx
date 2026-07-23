import { Link } from "@tanstack/react-router";
import { UserPlus, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveGroup } from "@/hooks/useActiveGroup";
import { TooltipButton } from "./TooltipButton";

const groupsButtonClassName =
  "border-purple-400/50 text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-colors";

export function GroupsIndicator({ isMobile }: { isMobile: boolean }) {
  const { user } = useAuth();
  const { activeGroup, hasGroups, isLoading } = useActiveGroup();

  if (!user) {
    return null;
  }

  return (
    <Link to="/groups">
      {hasGroups || isLoading ? (
        <TooltipButton
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className={groupsButtonClassName}
          tooltip={activeGroup ? `Active group: ${activeGroup.name}` : "View Your Groups"}
          isMobile={isMobile}
          aria-label={isMobile ? activeGroup?.name || "Groups" : undefined}
        >
          <Users className="h-4 w-4" />
          {!isMobile && (
            <span className="ml-2">{activeGroup?.name || "Groups"}</span>
          )}
        </TooltipButton>
      ) : (
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
      )}
    </Link>
  );
}
