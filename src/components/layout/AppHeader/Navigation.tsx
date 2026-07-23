import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GroupsIndicator } from "./GroupsIndicator";
import { TooltipButton } from "./TooltipButton";

interface NavigationProps {
  showBackButton?: boolean;
  backLabel?: string;
  showGroupsButton?: boolean;
  isMobile: boolean;
}

export function Navigation({
  showBackButton,
  backLabel = "Back",
  showGroupsButton,
  isMobile,
}: NavigationProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
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

      {showGroupsButton && <GroupsIndicator isMobile={isMobile} />}
    </div>
  );
}
