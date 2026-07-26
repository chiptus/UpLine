import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { ListSchedule } from "@/pages/EditionView/tabs/ScheduleTab/list/ListSchedule";
import {
  timelineSearchDefaults,
  timelineSearchSchema,
} from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/list",
)({
  component: ListSchedule,
  validateSearch: timelineSearchSchema,
  search: {
    middlewares: [stripSearchParams(timelineSearchDefaults)],
  },
});
