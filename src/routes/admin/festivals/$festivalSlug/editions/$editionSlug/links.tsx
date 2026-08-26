import { createFileRoute } from "@tanstack/react-router";
// PROTOTYPE — temporary, answers issue #376's layout question.
// Revert to `import { LinkWizard } from "@/pages/admin/festivals/LinkWizard/LinkWizard";` after the decision is made.
import { LinkWizardPrototypeLayout } from "@/pages/admin/festivals/LinkWizard/LinkWizard.prototype-layout";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/links",
)({
  component: FestivalLinks,
});

function FestivalLinks() {
  const { edition } = Route.useRouteContext();
  // Swap to <LinkWizard /> once the layout prototype decision is captured.
  return <LinkWizardPrototypeLayout editionId={edition.id} />;
}
