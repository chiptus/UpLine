import { useRef, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import { TopBar } from "./TopBar";
import { TitleSection } from "./AppHeader/TitleSection";
import { FestivalIndicator } from "./AppHeader/FestivalIndicator";

interface AppHeaderProps {
  // Navigation
  showBackButton?: boolean;
  backLabel?: string;

  // Page content
  title?: string;
  logoUrl?: string | null;

  // Navigation options
  showGroupsButton?: boolean;

  // External links
  websiteUrl?: string;
  ticketsUrl?: string;
}

export function AppHeader({
  showBackButton = false,
  backLabel = "Back",
  title,
  logoUrl,
  showGroupsButton = false,
  websiteUrl,
  ticketsUrl,
}: AppHeaderProps) {
  const titleRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLElement | null>(null);

  const shouldShowFestivalIcon = useShouldShowIconInTitle({
    logoRef,
    titleRef,
    logoUrl,
  });

  const handleLogoRefChange = useCallback((node: HTMLElement | null) => {
    logoRef.current = node;
  }, []);

  return (
    <TooltipProvider>
      <div>
        <TopBar
          showBackButton={showBackButton}
          backLabel={backLabel}
          showGroupsButton={showGroupsButton}
        >
          <FestivalIndicator
            isTitleVisible={!shouldShowFestivalIcon}
            logoUrl={logoUrl}
            festivalName={title}
          />
        </TopBar>

        <div ref={titleRef}>
          {title && (
            <TitleSection
              title={title}
              logoUrl={logoUrl}
              onLogoRefChange={handleLogoRefChange}
              websiteUrl={websiteUrl}
              ticketsUrl={ticketsUrl}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
function useShouldShowIconInTitle({
  logoRef,
  logoUrl,
  titleRef,
}: {
  logoRef: React.RefObject<Element>;
  titleRef: React.RefObject<Element>;
  logoUrl: string | null | undefined;
}) {
  const isLogoVisible = useScrollVisibility(logoRef, {
    rootMargin: "-80px 0px 0px 0px", // Negative top margin = trigger when logo is 80px from top (behind top bar)
  });

  const isTitleVisible = useScrollVisibility(titleRef, {
    rootMargin: "-80px 0px 0px 0px", // Same offset for consistency
  });

  return logoUrl ? !isLogoVisible : !isTitleVisible;
}
