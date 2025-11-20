import { createFileRoute } from "@tanstack/react-router";
import Groups from "@/pages/groups/Groups";

export const Route = createFileRoute("/groups/")({
  component: Groups,
});
