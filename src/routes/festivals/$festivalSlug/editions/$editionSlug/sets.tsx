import { createFileRoute, Outlet } from "@tanstack/react-router";
import { filterSortSearchSchema } from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets",
)({
  component: () => <Outlet />,
  validateSearch: filterSortSearchSchema,
});
