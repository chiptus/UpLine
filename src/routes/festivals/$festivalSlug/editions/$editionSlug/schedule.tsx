import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from "@tanstack/react-router";
import { ScheduleNavigation } from "@/pages/EditionView/tabs/ScheduleTab/ScheduleNavigation";
import { Outlet } from "@tanstack/react-router";
import { pageMeta } from "@/lib/pageHead";
import { canShowNowView } from "@/lib/nowView";
import { setsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import {
  timelineSearchDefaults,
  timelineSearchSchema,
} from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule",
)({
  component: ScheduleTab,
  head: ({ match }) => ({
    meta: pageMeta({ title: "Schedule", prefix: match.context.festival?.name }),
  }),
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
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(
      setsByEditionQuery(context.edition.id),
    );
    void context.queryClient.ensureQueryData(
      stagesByEditionQuery(context.edition.id),
    );
  },
});

function ScheduleTab() {
  return (
    <>
      <div className="space-y-3 md:space-y-6">
        <ScheduleNavigation />

        <Outlet />
      </div>
    </>
  );
}
