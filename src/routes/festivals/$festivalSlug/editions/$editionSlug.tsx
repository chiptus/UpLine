import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { EditionHeader } from "@/pages/EditionView/EditionHeader";
import { MainTabNavigation } from "@/pages/EditionView/TabNavigation/TabNavigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { stagesKeys } from "@/api/stages/types";
import { getEffectiveFestivalPhase } from "@/lib/festivalPhase";
import { getDefaultTab } from "@/pages/EditionView/TabNavigation/defaultTab";
import { tabRoutes } from "@/pages/EditionView/TabNavigation/tabRoutes";
import { pageMeta } from "@/lib/pageHead";
import { EditionViewRoot } from "@/pages/EditionView/EditionViewRoot";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug",
)({
  component: EditionLayout,
  beforeLoad: async ({ params, location, context }) => {
    const edition = await context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalId: context.festival.id,
        editionSlug: params.editionSlug,
      }),
    );

    const basePath = `/festivals/${params.festivalSlug}/editions/${params.editionSlug}`;
    if (
      location.pathname === basePath ||
      location.pathname === `${basePath}/`
    ) {
      const phase = getEffectiveFestivalPhase({
        override: edition.phase_override,
        derivedInput: {
          revealLevel: edition.schedule_reveal_level,
          startDate: edition.start_date,
          endDate: edition.end_date,
          timezone: context.festival.timezone,
          now: new Date(),
        },
      });

      throw redirect({
        to: tabRoutes[getDefaultTab(phase)],
        params,
        search: location.search as Record<string, unknown>,
      });
    }

    return { edition };
  },
  loader: async ({ context }) => {
    void context.queryClient
      .ensureQueryData(stagesByEditionQuery(context.edition.id))
      .then((stages) => {
        for (const stage of stages) {
          context.queryClient.setQueryData(stagesKeys.byId(stage.id), stage);
        }
      });
  },
  head: ({ match }) => ({
    meta: pageMeta({
      title: match.context.edition?.name,
      prefix: match.context.festival?.name,
    }),
  }),
});

function EditionLayout() {
  const { festival, edition } = useFestivalEdition();

  if (!edition) {
    return (
      <EditionViewRoot className="flex items-center justify-center">
        <div className="text-white text-xl">Loading edition...</div>
      </EditionViewRoot>
    );
  }

  return (
    <EditionViewRoot>
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
    </EditionViewRoot>
  );
}
