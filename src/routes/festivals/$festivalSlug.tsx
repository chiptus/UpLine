import { createFileRoute, Outlet } from "@tanstack/react-router";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { festivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import { customLinksQuery } from "@/api/custom-links/useCustomLinks";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute("/festivals/$festivalSlug")({
  beforeLoad: async ({ params, context }) => {
    const festival = await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
    return { festival };
  },
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(
      festivalInfoQuery(context.festival.id),
    );
    void context.queryClient.ensureQueryData(
      customLinksQuery(context.festival.id),
    );
  },
  component: FestivalLayout,
  head: ({ match }) => ({
    meta: pageMeta({ title: match.context.festival?.name }),
  }),
});

function FestivalLayout() {
  return <Outlet />;
}
