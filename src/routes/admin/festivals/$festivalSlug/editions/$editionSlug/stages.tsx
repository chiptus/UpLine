import { createFileRoute } from "@tanstack/react-router";
import FestivalStages from "@/pages/admin/festivals/FestivalStages";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
)({
  component: FestivalStages,
});
