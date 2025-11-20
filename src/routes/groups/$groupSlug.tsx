import { createFileRoute } from "@tanstack/react-router";
import GroupDetail from "@/pages/groups/GroupDetail";

export const Route = createFileRoute("/groups/$groupSlug")({
  component: GroupDetail,
});
