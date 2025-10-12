import { useIsMobile } from "@/hooks/use-mobile";
import { AppBranding } from "./AppHeader/AppBranding";
import { FestivalIndicator } from "./AppHeader/FestivalIndicator";
import { UserActions } from "./AppHeader/UserActions";

interface TopBarProps {
  showBackButton?: boolean;
  backLabel?: string;
  showGroupsButton?: boolean;

  // Festival context
  isTitleVisible?: boolean;
  logoUrl?: string | null;
  title?: string;
}

export function TopBar({
  showBackButton = false,
  backLabel = "Back",
  showGroupsButton = false,

  isTitleVisible = false,
  logoUrl,
  title,
}: TopBarProps) {
  const isMobile = useIsMobile();

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-purple-400/20 flex items-center px-4 py-3 md:py-4">
        <AppBranding isMobile={isMobile} />

        <FestivalIndicator
          isTitleVisible={isTitleVisible}
          logoUrl={logoUrl}
          title={title}
        />

        <UserActions
          showBackButton={showBackButton}
          backLabel={backLabel}
          showGroupsButton={showGroupsButton}
          isMobile={isMobile}
        />
      </div>
      <div className="h-16 md:h-20" /> {/* Spacer to offset fixed top bar */}
    </>
  );
}
