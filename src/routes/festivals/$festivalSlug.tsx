import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FestivalEditionProvider } from "@/contexts/FestivalEditionContext";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { festivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import { customLinksQuery } from "@/api/custom-links/useCustomLinks";
import { PageTitle } from "@/components/PageTitle/PageTitle";

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
});

function FestivalLayout() {
  const { festivalSlug } = Route.useParams();
  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const { editionSlug } = useParams({ strict: false });

  return (
    <FestivalEditionProvider festival={festival} editionSlug={editionSlug}>
      <PageTitle title={festival.name} />
      <Outlet />
    </FestivalEditionProvider>
  );
}
