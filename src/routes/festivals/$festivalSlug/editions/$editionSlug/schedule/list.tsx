import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { ScheduleTabList } from "@/pages/EditionView/tabs/ScheduleTab/list/ListTab";
import {
  timelineSearchDefaults,
  timelineSearchSchema,
} from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/list",
)({
  component: ScheduleTabList,
  validateSearch: timelineSearchSchema,
  search: {
    middlewares: [stripSearchParams(timelineSearchDefaults)],
  },
});
