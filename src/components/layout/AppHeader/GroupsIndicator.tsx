import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import { cn } from "@/lib/utils";
import { TooltipButton } from "./TooltipButton";
import { ActiveGroupSwitcher } from "./GroupSwitcher/ActiveGroupSwitcher";

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
  const { data: groups } = useSuspenseQuery(userGroupsQuery(userId));

  if (groups.length === 0) {
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

  return (
    <ActiveGroupSwitcher
      groups={groups}
      isMobile={isMobile}
      className={groupsButtonClassName}
    />
  );
}
