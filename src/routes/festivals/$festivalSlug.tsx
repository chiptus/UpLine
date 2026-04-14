import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { FestivalEditionProvider } from "@/contexts/FestivalEditionContext";

export const Route = createFileRoute("/festivals/$festivalSlug")({
  component: FestivalLayout,
});

function FestivalLayout() {
  const { festivalSlug, editionSlug } = useParams({ strict: false }) as {
    festivalSlug: string;
    editionSlug?: string;
  };

  return (
    <FestivalEditionProvider festivalSlug={festivalSlug} editionSlug={editionSlug}>
      <Outlet />
    </FestivalEditionProvider>
  );
}
