import { createFileRoute } from "@tanstack/react-router";
import FestivalDetail from "@/pages/admin/festivals/FestivalDetail";

export const Route = createFileRoute("/admin/festivals/$festivalSlug")({
  component: FestivalDetail,
});
