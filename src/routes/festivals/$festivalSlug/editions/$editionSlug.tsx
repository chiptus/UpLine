import { createFileRoute, redirect } from "@tanstack/react-router";
import EditionLayout from "@/pages/EditionView/EditionLayout";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
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

    const edition = await context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalSlug: params.festivalSlug,
        editionSlug: params.editionSlug,
      }),
    );

    return { edition };
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      stagesByEditionQuery(context.edition.id),
    );
  },
});
