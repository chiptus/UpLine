import { createFileRoute } from "@tanstack/react-router";
import { ScheduleTabList } from "@/pages/EditionView/tabs/ScheduleTab/list/ListTab";
import { timelineSearchSchema } from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/list",
)({
  component: ScheduleTabList,
  validateSearch: timelineSearchSchema,
});
