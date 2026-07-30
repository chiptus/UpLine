import { createFileRoute } from "@tanstack/react-router";
import { StageManagement } from "@/pages/admin/festivals/StageManagement";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
)({
  component: FestivalStages,
});

function FestivalStages() {
  return <StageManagement />;
}
