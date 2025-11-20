import { createFileRoute, redirect } from "@tanstack/react-router";
import FestivalEdition from "@/pages/admin/festivals/FestivalEdition";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug",
)({
  component: FestivalEdition,
  beforeLoad: ({ location }) => {
    if (location.pathname.endsWith(location.params.editionSlug)) {
      throw redirect({
        to: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
        params: location.params,
        search: location.search,
      });
    }
  },
});
