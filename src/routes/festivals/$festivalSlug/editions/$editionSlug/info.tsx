import { createFileRoute } from "@tanstack/react-router";
import { InfoTab } from "@/pages/EditionView/tabs/InfoTab";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/info",
)({
  component: InfoTab,
});
