import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveGroup } from "@/hooks/useActiveGroup";

interface NavigationProps {
  showBackButton?: boolean;
  backLabel?: string;
  showGroupsButton?: boolean;
  isMobile: boolean;
}

function TooltipButton({
  children,
  tooltip,
  isMobile,
  ...props
}: {
  children: React.ReactNode;
  tooltip: string;
  isMobile: boolean;
  [key: string]: unknown;
}) {
  if (!isMobile) {
    return <Button {...props}>{children}</Button>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function Navigation({
  showBackButton,
  backLabel = "Back",
  showGroupsButton,
  isMobile,
}: NavigationProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { activeGroup, hasGroups } = useActiveGroup();

  const groupsButtonClassName =
    "border-purple-400/50 text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-colors";

  return (
    <div className="flex items-center gap-3">
      {/* Back Navigation */}
      {showBackButton && (
        <TooltipButton
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={() => router.history.back()}
          className="border-purple-400/50 text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-colors"
          tooltip={backLabel}
          isMobile={isMobile}
          aria-label={isMobile ? backLabel : undefined}
        >
          <ArrowLeft className="h-4 w-4" />
          {!isMobile && <span className="ml-2">{backLabel}</span>}
        </TooltipButton>
      )}

      {/* Groups / Active Group Indicator */}
      {showGroupsButton && user && (
        <Link to="/groups">
          {hasGroups ? (
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
      )}
    </div>
  );
}
