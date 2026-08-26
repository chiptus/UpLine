import { createFileRoute } from "@tanstack/react-router";
import { LinkWizard } from "@/pages/admin/festivals/LinkWizard/LinkWizard";
// PROTOTYPE — dev-only, answers issue #376's layout question. Remove this
// import and the dev check below once the layout decision is captured.
import { LinkWizardPrototypeLayout } from "@/pages/admin/festivals/LinkWizard/LinkWizard.prototype-layout";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/links",
)({
  component: FestivalLinks,
});

function FestivalLinks() {
  const { edition } = Route.useRouteContext();
  if (import.meta.env.DEV) {
    return <LinkWizardPrototypeLayout editionId={edition.id} />;
  }
  return <LinkWizard editionId={edition.id} />;
}
