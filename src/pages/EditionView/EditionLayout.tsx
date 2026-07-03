import { AppHeader } from "@/components/layout/AppHeader";
import { MainTabNavigation } from "./TabNavigation/TabNavigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { Outlet } from "@tanstack/react-router";
import { useCustomLinksQuery } from "@/api/custom-links/useCustomLinks";

export default function EditionView() {
  const { festival, edition } = useFestivalEdition();
  const customLinksQuery = useCustomLinksQuery(festival.id);

  if (!edition) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading edition...</div>
      </div>
    );
  }

  const customLinks = customLinksQuery.data || [];
  const websiteUrl = customLinks.find(
    (link) => link.link_type === "website",
  )?.url;
  const ticketsUrl = customLinks.find(
    (link) => link.link_type === "tickets",
  )?.url;

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="container mx-auto px-4 py-4 md:py-8 pb-20 md:pb-8">
        <AppHeader
          title={`${festival.name} - ${edition.name}`}
          logoUrl={festival.logo_url}
          showGroupsButton
          websiteUrl={websiteUrl}
          ticketsUrl={ticketsUrl}
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
