import { createFileRoute, redirect } from "@tanstack/react-router";
import { ScheduleTabNow } from "@/pages/EditionView/tabs/ScheduleTab/now/NowBoard";
import { getFestivalPhase } from "@/lib/festivalPhase";
import { canShowTime } from "@/lib/scheduleReveal";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/now",
)({
  component: ScheduleTabNow,
  beforeLoad: ({ params, location, context }) => {
    const phase = getFestivalPhase({
      revealLevel: context.edition.schedule_reveal_level,
      startDate: context.edition.start_date,
      endDate: context.edition.end_date,
      timezone: context.festival.timezone,
      now: new Date(),
    });

    if (
      phase !== "live" ||
      !canShowTime(context.edition.schedule_reveal_level)
    ) {
      throw redirect({
        to: "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
        params,
        search: location.search as Record<string, unknown>,
      });
    }
  },
});
