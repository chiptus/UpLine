import { createFileRoute, redirect } from "@tanstack/react-router";
import EditionLayout from "@/pages/EditionView/EditionLayout";
import { editionsKeys } from "@/hooks/queries/festivals/editions/types";
import { fetchFestivalEditionBySlug } from "@/hooks/queries/festivals/editions/useFestivalEditionBySlug";

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

    await context.queryClient.ensureQueryData({
      queryKey: editionsKeys.bySlug(params.festivalSlug, params.editionSlug),
      queryFn: () =>
        fetchFestivalEditionBySlug({
          festivalSlug: params.festivalSlug,
          editionSlug: params.editionSlug,
        }),
    });
  },
});
