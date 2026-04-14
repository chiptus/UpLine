import { createFileRoute } from "@tanstack/react-router";
import EditionSelection from "@/pages/EditionSelection";

export const Route = createFileRoute("/festivals/$festivalSlug/")({
  component: EditionSelection,
});
