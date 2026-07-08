import {
  createFileRoute,
  Outlet,
  stripSearchParams,
} from "@tanstack/react-router";
import {
  filterSortSearchDefaults,
  filterSortSearchSchema,
} from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets",
)({
  component: () => <Outlet />,
  validateSearch: filterSortSearchSchema,
  search: {
    middlewares: [stripSearchParams(filterSortSearchDefaults)],
  },
});
