import { createFileRoute } from "@tanstack/react-router";
import { ArtistsTab } from "@/pages/EditionView/tabs/ArtistsTab/ArtistsTab";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets",
)({
  component: ArtistsTab,
});
