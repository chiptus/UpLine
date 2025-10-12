import { useRef, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import { TopBar } from "./TopBar";
import { TitleSection } from "./AppHeader/TitleSection";

interface AppHeaderProps {
  // Navigation
  showBackButton?: boolean;
  backLabel?: string;

  // Page content
  title?: string;
  logoUrl?: string | null;

  // Navigation options
  showGroupsButton?: boolean;
}

export function AppHeader({
  showBackButton = false,
  backLabel = "Back",
  title,

  logoUrl,

  showGroupsButton = false,
}: AppHeaderProps) {
  // Track visibility of logo specifically for festival context in top bar
  const titleRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLElement | null>(null);

  // Use logo visibility with top bar offset - trigger when logo hits the top bar
  const isLogoVisible = useScrollVisibility(logoRef, {
    rootMargin: "-80px 0px 0px 0px", // Negative top margin = trigger when logo is 80px from top (behind top bar)
  });
  const isTitleVisible = useScrollVisibility(titleRef, {
    rootMargin: "-80px 0px 0px 0px", // Same offset for consistency
  });
  const shouldShowFestivalIcon = logoUrl ? !isLogoVisible : !isTitleVisible;

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
          isTitleVisible={!shouldShowFestivalIcon}
          logoUrl={logoUrl}
          title={title}
        />

        <div ref={titleRef}>
          <TitleSection
            title={title}
            logoUrl={logoUrl}
            onLogoRefChange={handleLogoRefChange}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
