import { createFileRoute } from "@tanstack/react-router";
import { SetDetails } from "@/pages/SetDetails";
import { filterSortSearchSchema } from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
)({
  component: SetDetails,
  validateSearch: filterSortSearchSchema,
});
