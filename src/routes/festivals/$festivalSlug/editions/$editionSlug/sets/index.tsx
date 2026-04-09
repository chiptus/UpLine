import { createFileRoute } from "@tanstack/react-router";
import { ArtistsTab } from "@/pages/EditionView/tabs/ArtistsTab/ArtistsTab";
import { filterSortSearchSchema } from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/",
)({
  component: ArtistsTab,
  validateSearch: filterSortSearchSchema,
});
