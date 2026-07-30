import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { UserPlus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveGroup } from "@/hooks/useActiveGroup";
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
  const { activeGroup, hasGroups } = useActiveGroup(userId);

  return (
    <Link to="/groups">
      {hasGroups ? (
        <TooltipButton
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className={groupsButtonClassName}
          tooltip={
            activeGroup
              ? `Active group: ${activeGroup.name}`
              : "View Your Groups"
          }
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
