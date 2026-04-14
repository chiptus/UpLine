import { createFileRoute } from "@tanstack/react-router";
import { SocialTab } from "@/pages/EditionView/tabs/SocialTab";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/social",
)({
  component: SocialTab,
});
