import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

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

  return (
    <div className="flex items-center gap-3">
      {/* Back Navigation */}
      {showBackButton && (
        <TooltipButton
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={() => window.history.back()}
          className="border-purple-400/50 text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-colors"
          tooltip={backLabel}
          isMobile={isMobile}
        >
          <ArrowLeft className="h-4 w-4" />
          {!isMobile && <span className="ml-2">{backLabel}</span>}
        </TooltipButton>
      )}

      {/* Groups Button */}
      {showGroupsButton && user && (
        <Link to="/groups">
          <TooltipButton
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="border-purple-400/50 text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-colors"
            tooltip="View Your Groups"
            isMobile={isMobile}
          >
            <Users className="h-4 w-4" />
            {!isMobile && <span className="ml-2">Groups</span>}
          </TooltipButton>
        </Link>
      )}
    </div>
  );
}
