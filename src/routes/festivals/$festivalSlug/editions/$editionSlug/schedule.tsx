import { createFileRoute, redirect } from "@tanstack/react-router";
import { ScheduleTab } from "@/pages/EditionView/tabs/ScheduleTab";
import { filterSortSearchSchema } from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule",
)({
  component: ScheduleTab,
  validateSearch: filterSortSearchSchema,
  beforeLoad: ({ params, location }) => {
    if (location.pathname.endsWith("/schedule")) {
      throw redirect({
        to: "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
        params,
        search: location.search as Record<string, unknown>,
      });
    }
  },
});
