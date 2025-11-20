import { createFileRoute } from "@tanstack/react-router";
import FestivalSelection from "@/pages/FestivalSelection";

export const Route = createFileRoute("/")({
  component: FestivalSelection,
});
