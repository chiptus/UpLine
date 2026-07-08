import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { ScheduleTabTimeline } from "@/pages/EditionView/tabs/ScheduleTab/TimelineTab";
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
