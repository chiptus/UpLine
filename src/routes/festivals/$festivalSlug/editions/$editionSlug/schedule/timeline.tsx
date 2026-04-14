import { createFileRoute } from "@tanstack/react-router";
import { ScheduleTabTimeline } from "@/pages/EditionView/tabs/ScheduleTab/TimelineTab";
import { timelineSearchSchema } from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
)({
  component: ScheduleTabTimeline,
  validateSearch: timelineSearchSchema,
});
