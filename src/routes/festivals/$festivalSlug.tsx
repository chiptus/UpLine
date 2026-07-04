import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FestivalEditionProvider } from "@/contexts/FestivalEditionContext";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";

export const Route = createFileRoute("/festivals/$festivalSlug")({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
  },
  component: FestivalLayout,
});

function FestivalLayout() {
  const { festivalSlug } = Route.useParams();
  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const { editionSlug } = useParams({ strict: false });

  return (
    <FestivalEditionProvider festival={festival} editionSlug={editionSlug}>
      <Outlet />
    </FestivalEditionProvider>
  );
}
