import { createFileRoute } from "@tanstack/react-router";
import { LinkWizard } from "@/pages/admin/festivals/LinkWizard/LinkWizard";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/links",
)({
  component: FestivalLinks,
});

function FestivalLinks() {
  const { edition } = Route.useRouteContext();
  return <LinkWizard editionId={edition.id} />;
}
