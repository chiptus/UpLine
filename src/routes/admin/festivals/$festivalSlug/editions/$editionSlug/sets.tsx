import { createFileRoute } from "@tanstack/react-router";
import { SetManagement } from "@/pages/admin/festivals/SetsManagement/SetManagement";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/sets",
)({
  component: FestivalSets,
});

function FestivalSets() {
  return <SetManagement />;
}
