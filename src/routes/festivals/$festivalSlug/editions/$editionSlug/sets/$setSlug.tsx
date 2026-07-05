import { createFileRoute } from "@tanstack/react-router";
import { SetDetails } from "@/pages/SetDetails";
import { filterSortSearchSchema } from "@/lib/searchSchemas";
import { setBySlugQuery } from "@/api/sets/useSetBySlug";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
)({
  component: SetDetails,
  validateSearch: filterSortSearchSchema,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      setBySlugQuery(params.setSlug, context.edition.id),
    );
  },
});
