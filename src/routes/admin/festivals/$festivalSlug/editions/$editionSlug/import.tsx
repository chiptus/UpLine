import { createFileRoute } from "@tanstack/react-router";
import FestivalScheduleImport from "@/pages/admin/festivals/FestivalScheduleImport";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/import",
)({
  component: FestivalScheduleImport,
});
