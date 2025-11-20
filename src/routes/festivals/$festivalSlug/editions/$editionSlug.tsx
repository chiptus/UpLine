import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import EditionLayout from "@/pages/EditionView/EditionLayout";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug",
)({
  component: EditionLayoutWrapper,
  beforeLoad: ({ location }) => {
    if (location.pathname.endsWith(location.params.editionSlug)) {
      throw redirect({
        to: "/festivals/$festivalSlug/editions/$editionSlug/sets",
        params: location.params,
        search: location.search,
      });
    }
  },
});

function EditionLayoutWrapper() {
  return <EditionLayout />;
}
