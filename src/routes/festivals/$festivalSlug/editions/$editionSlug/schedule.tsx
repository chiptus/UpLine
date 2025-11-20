import { createFileRoute, redirect } from "@tanstack/react-router";
import { ScheduleTab } from "@/pages/EditionView/tabs/ScheduleTab";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule",
)({
  component: ScheduleTab,
  beforeLoad: ({ location }) => {
    if (location.pathname.endsWith("/schedule")) {
      throw redirect({
        to: "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
        params: location.params,
        search: location.search,
      });
    }
  },
});
