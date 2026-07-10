import { createFileRoute, redirect } from "@tanstack/react-router";
import FestivalEdition from "@/pages/admin/festivals/FestivalEdition";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug",
)({
  component: FestivalEdition,
  beforeLoad: async ({ params, location, context }) => {
    if (params?.editionSlug && location.pathname.endsWith(params.editionSlug)) {
      throw redirect({
        to: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
        params,
        search: location.search as Record<string, unknown>,
      });
    }

    await context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalSlug: params.festivalSlug,
        editionSlug: params.editionSlug,
      }),
    );

    return {
      ...context,
      festivalSlug: params.festivalSlug,
      editionSlug: params.editionSlug,
    };
  },
});
