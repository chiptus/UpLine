import { createFileRoute } from "@tanstack/react-router";
import FestivalDetail from "@/pages/admin/festivals/FestivalDetail";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";

export const Route = createFileRoute("/admin/festivals/$festivalSlug")({
  component: FestivalDetail,
  beforeLoad: async ({ params, context }) => {
    const festival = await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
    return { festival };
  },
});
