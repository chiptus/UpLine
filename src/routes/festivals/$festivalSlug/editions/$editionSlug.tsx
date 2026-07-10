import { createFileRoute, redirect } from "@tanstack/react-router";
import EditionLayout from "@/pages/EditionView/EditionLayout";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug",
)({
  component: EditionLayout,
  beforeLoad: async ({ params, location, context }) => {
    if (params?.editionSlug && location.pathname.endsWith(params.editionSlug)) {
      throw redirect({
        to: "/festivals/$festivalSlug/editions/$editionSlug/sets",
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
