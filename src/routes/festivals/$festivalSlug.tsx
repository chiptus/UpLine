import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { FestivalEditionProvider } from "@/contexts/FestivalEditionContext";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";

export const Route = createFileRoute("/festivals/$festivalSlug")({
  loader: async ({ params, context }) => {
    const festival = await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
    return { festival };
  },
  component: FestivalLayout,
});

function FestivalLayout() {
  const { festival } = Route.useLoaderData();
  const { editionSlug } = useParams({ strict: false });

  return (
    <FestivalEditionProvider festival={festival} editionSlug={editionSlug}>
      <Outlet />
    </FestivalEditionProvider>
  );
}
