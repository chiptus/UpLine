import { createFileRoute } from "@tanstack/react-router";
import { SetDetails } from "@/pages/SetDetails";
import { filterSortSearchSchema } from "@/lib/searchSchemas";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { setBySlugQuery } from "@/api/sets/useSetBySlug";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
)({
  component: SetDetails,
  validateSearch: filterSortSearchSchema,
  loader: async ({ params, context }) => {
    const edition = await context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalSlug: params.festivalSlug,
        editionSlug: params.editionSlug,
      }),
    );
    await context.queryClient.ensureQueryData(
      setBySlugQuery(params.setSlug, edition.id),
    );
  },
});
