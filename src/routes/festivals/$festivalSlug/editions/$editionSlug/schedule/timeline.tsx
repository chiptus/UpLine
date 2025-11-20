import { createFileRoute } from "@tanstack/react-router";
import { ScheduleTabTimeline } from "@/pages/EditionView/tabs/ScheduleTab/TimelineTab";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
)({
  component: ScheduleTabTimeline,
});
