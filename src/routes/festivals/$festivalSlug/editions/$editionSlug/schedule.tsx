import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from "@tanstack/react-router";
import { ScheduleTab } from "@/pages/EditionView/tabs/ScheduleTab";
import { canShowNowView } from "@/lib/nowView";
import {
  timelineSearchDefaults,
  timelineSearchSchema,
} from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule",
)({
  component: ScheduleTab,
  validateSearch: timelineSearchSchema,
  search: {
    middlewares: [stripSearchParams(timelineSearchDefaults)],
  },
  beforeLoad: ({ params, location, context }) => {
    if (location.pathname.endsWith("/schedule")) {
      const liveNow = canShowNowView(
        context.edition,
        context.festival.timezone,
        new Date(),
      );

      throw redirect({
        to: liveNow
          ? "/festivals/$festivalSlug/editions/$editionSlug/schedule/now"
          : "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
        params,
        search: location.search as Record<string, unknown>,
      });
    }
  },
});
