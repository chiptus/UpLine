import { createFileRoute } from "@tanstack/react-router";
import { MapTab } from "@/pages/EditionView/tabs/MapTab";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/map",
)({
  component: MapTab,
});
