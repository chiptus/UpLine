import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from "@tanstack/react-router";
import { ScheduleTab } from "@/pages/EditionView/tabs/ScheduleTab";
import { getFestivalPhase } from "@/lib/festivalPhase";
import { canShowTime } from "@/lib/scheduleReveal";
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
      const phase = getFestivalPhase({
        revealLevel: context.edition.schedule_reveal_level,
        startDate: context.edition.start_date,
        endDate: context.edition.end_date,
        timezone: context.festival.timezone,
        now: new Date(),
      });
      const liveNow =
        phase === "live" && canShowTime(context.edition.schedule_reveal_level);

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
