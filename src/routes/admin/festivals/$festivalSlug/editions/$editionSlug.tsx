import { createFileRoute, redirect } from "@tanstack/react-router";
import FestivalEdition from "@/pages/admin/festivals/FestivalEdition";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";

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

    const festivalId = context.queryClient.getQueryData(
      festivalBySlugQuery(params.festivalSlug).queryKey,
    )?.id;

    await context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalSlug: params.festivalSlug,
        editionSlug: params.editionSlug,
        festivalId,
      }),
    );

    return {
      ...context,
      festivalSlug: params.festivalSlug,
      editionSlug: params.editionSlug,
    };
  },
});
