import { createFileRoute } from "@tanstack/react-router";
import FestivalSets from "@/pages/admin/festivals/FestivalSets";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/sets",
)({
  component: FestivalSets,
});
