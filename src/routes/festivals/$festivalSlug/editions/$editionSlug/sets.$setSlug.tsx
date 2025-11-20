import { createFileRoute } from "@tanstack/react-router";
import { SetDetails } from "@/pages/SetDetails";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
)({
  component: SetDetails,
});
