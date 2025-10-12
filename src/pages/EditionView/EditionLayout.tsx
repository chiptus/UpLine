import { AppHeader } from "@/components/layout/AppHeader";
import { MainTabNavigation } from "./TabNavigation/TabNavigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { Outlet } from "react-router-dom";

export default function EditionView() {
  const { festival, edition, isContextReady } = useFestivalEdition();

  if (!isContextReady) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading festival...</div>
      </div>
    );
  }

  if (!festival || !edition) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading festival...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="container mx-auto px-4 py-4 md:py-8 pb-20 md:pb-8">
        <AppHeader
          title={festival.name}
          logoUrl={festival.logo_url}
          showGroupsButton
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
