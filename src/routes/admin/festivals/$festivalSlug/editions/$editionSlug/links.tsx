import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { LinkWizard } from "@/pages/admin/festivals/LinkWizard/LinkWizard";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/links",
)({
  component: FestivalLinks,
});

function FestivalLinks() {
  const { edition } = Route.useRouteContext();
  const { festivalSlug } = Route.useParams();
  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  return <LinkWizard editionId={edition.id} timezone={festival.timezone} />;
}
