import { useCallback, useRef } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { FestivalIndicator } from "@/components/layout/AppHeader/FestivalIndicator";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import { MainTabNavigation } from "./TabNavigation/TabNavigation";
import { IdentityRow } from "./IdentityRow";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { Outlet } from "@tanstack/react-router";

export default function EditionView() {
  const { festival, edition } = useFestivalEdition();
  const rowRef = useRef<HTMLElement | null>(null);
  const isRowVisible = useScrollVisibility(rowRef, {
    rootMargin: "-80px 0px 0px 0px", // Negative top margin = trigger when the row is 80px from top (behind top bar)
  });
  const handleRowRefChange = useCallback((node: HTMLElement | null) => {
    rowRef.current = node;
  }, []);

  if (!edition) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading edition...</div>
      </div>
    );
  }

  const title = `${festival.name} - ${edition.name}`;

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="container mx-auto px-4 py-4 md:py-8 pb-20 md:pb-8">
        <TopBar showGroupsButton>
          <FestivalIndicator
            isTitleVisible={isRowVisible}
            logoUrl={festival.logo_url}
            title={title}
          />
        </TopBar>

        <IdentityRow
          title={title}
          logoUrl={festival.logo_url}
          onRowRefChange={handleRowRefChange}
        />

        <MainTabNavigation />

        <div className="mt-4 md:mt-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
