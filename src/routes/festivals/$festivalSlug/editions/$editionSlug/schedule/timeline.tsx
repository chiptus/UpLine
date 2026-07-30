import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { Timeline } from "@/pages/EditionView/tabs/ScheduleTab/horizontal/Timeline";
import {
  timelineSearchDefaults,
  timelineSearchSchema,
} from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
)({
  component: ScheduleTabTimeline,
  validateSearch: timelineSearchSchema,
  search: {
    middlewares: [stripSearchParams(timelineSearchDefaults)],
  },
});

function ScheduleTabTimeline() {
  return <Timeline />;
}
