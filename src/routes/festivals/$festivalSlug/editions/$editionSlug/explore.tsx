import { createFileRoute } from "@tanstack/react-router";
import { ExploreSetPage } from "@/pages/ExploreSetPage/ExploreSetPage";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/explore",
)({
  component: ExploreSetPage,
});
