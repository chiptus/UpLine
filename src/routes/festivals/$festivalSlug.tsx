import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { FestivalEditionProvider } from "@/contexts/FestivalEditionContext";
import { festivalsKeys } from "@/hooks/queries/festivals/types";
import { fetchFestivalBySlug } from "@/hooks/queries/festivals/useFestivalBySlug";
import type { QueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/festivals/$festivalSlug")({
  loader: async ({ params, context }) => {
    const queryClient = (context as { queryClient: QueryClient }).queryClient;
    const festival = await queryClient.ensureQueryData({
      queryKey: festivalsKeys.bySlug(params.festivalSlug),
      queryFn: () => fetchFestivalBySlug(params.festivalSlug),
    });
    return { festival };
  },
  component: FestivalLayout,
});

function FestivalLayout() {
  const { festival } = Route.useLoaderData();
  const { editionSlug } = useParams({ strict: false }) as {
    editionSlug?: string;
  };

  return (
    <FestivalEditionProvider festival={festival} editionSlug={editionSlug}>
      <Outlet />
    </FestivalEditionProvider>
  );
}
