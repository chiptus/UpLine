import { createFileRoute, redirect } from "@tanstack/react-router";
import EditionLayout from "@/pages/EditionView/EditionLayout";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { getFestivalPhase } from "@/lib/festivalPhase";
import { getDefaultTab } from "@/pages/EditionView/TabNavigation/defaultTab";
import { tabRoutes } from "@/pages/EditionView/TabNavigation/tabRoutes";

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
    if (location.pathname === basePath || location.pathname === `${basePath}/`) {
      const phase = getFestivalPhase({
        revealLevel: edition.schedule_reveal_level,
        startDate: edition.start_date,
        endDate: edition.end_date,
        timezone: context.festival.timezone,
        now: new Date(),
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
    void context.queryClient.ensureQueryData(
      stagesByEditionQuery(context.edition.id),
    );
  },
});
