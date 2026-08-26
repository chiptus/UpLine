import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";
import { LinkWizard } from "@/pages/admin/festivals/LinkWizard/LinkWizard";

// PROTOTYPE (issue #376 Q13): ?variant= selects a throwaway layout variant.
// Remove the search schema once a layout wins.
const linksSearchSchema = z.object({
  variant: z.enum(["a", "b", "c"]).catch("a"),
});

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/links",
)({
  component: FestivalLinks,
  validateSearch: linksSearchSchema,
  search: {
    middlewares: [stripSearchParams({ variant: "a" as const })],
  },
});

function FestivalLinks() {
  const { edition } = Route.useRouteContext();
  const { variant } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <LinkWizard
      editionId={edition.id}
      variant={variant}
      onVariantChange={(next) =>
        navigate({
          search: (prev) => ({ ...prev, variant: next }),
          replace: true,
        })
      }
    />
  );
}
