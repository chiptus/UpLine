import { EditionHeader } from "./EditionHeader";
import { MainTabNavigation } from "./TabNavigation/TabNavigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { Outlet } from "@tanstack/react-router";

export default function EditionView() {
  const { festival, edition } = useFestivalEdition();

  if (!edition) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading edition...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="container mx-auto px-4 py-4 md:py-8 pb-20 md:pb-8">
        <EditionHeader
          title={`${festival.name} - ${edition.name}`}
          festivalName={festival.name}
          logoUrl={festival.logo_url}
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
