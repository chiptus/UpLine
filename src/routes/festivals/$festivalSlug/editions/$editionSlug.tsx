import { createFileRoute, redirect } from "@tanstack/react-router";
import EditionLayout from "@/pages/EditionView/EditionLayout";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { getFestivalPhase } from "@/lib/festivalPhase";
import { getDefaultTab } from "@/pages/EditionView/TabNavigation/defaultTab";
import { tabRoutes } from "@/pages/EditionView/TabNavigation/tabRoutes";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug",
)({
  component: EditionLayout,
  beforeLoad: async ({ params, location, context }) => {
    if (params?.editionSlug && location.pathname.endsWith(params.editionSlug)) {
      const [festival, edition] = await Promise.all([
        context.queryClient.ensureQueryData(
          festivalBySlugQuery(params.festivalSlug),
        ),
        context.queryClient.ensureQueryData(
          editionBySlugQuery({
            festivalSlug: params.festivalSlug,
            editionSlug: params.editionSlug,
          }),
        ),
      ]);

      const phase = getFestivalPhase({
        revealLevel: edition.schedule_reveal_level,
        startDate: edition.start_date,
        endDate: edition.end_date,
        timezone: festival.timezone,
        now: new Date(),
      });

      throw redirect({
        to: tabRoutes[getDefaultTab(phase)],
        params,
        search: location.search as Record<string, unknown>,
      });
    }

    const festival = await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
    const edition = await context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalId: festival.id,
        editionSlug: params.editionSlug,
      }),
    );

    return { edition };
  },
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(
      stagesByEditionQuery(context.edition.id),
    );
  },
});
