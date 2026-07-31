import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from "@tanstack/react-router";
import { ScheduleNavigation } from "@/pages/EditionView/tabs/ScheduleTab/ScheduleNavigation";
import { Outlet } from "@tanstack/react-router";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";
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

function ScheduleTab() {
  const { festival } = useFestivalEdition();

  return (
    <>
      <PageTitle title="Schedule" prefix={festival?.name} />
      <div className="space-y-3 md:space-y-6">
        <ScheduleNavigation />

        <Outlet />
      </div>
    </>
  );
}
