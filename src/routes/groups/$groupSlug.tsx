import { createFileRoute } from "@tanstack/react-router";
import GroupDetail from "@/pages/groups/GroupDetail";
import { groupBySlugQuery } from "@/api/groups/useGroupBySlug";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import { groupInvitesQuery } from "@/api/invites/useGroupInvites";

export const Route = createFileRoute("/groups/$groupSlug")({
  component: GroupDetail,
  loader: async ({ params, context }) => {
    if (!context.user) return;

    const group = await context.queryClient.ensureQueryData(
      groupBySlugQuery(params.groupSlug, context.user.id),
    );
    await context.queryClient.ensureQueryData(groupMembersQuery(group.id));

    if (group.created_by === context.user.id) {
      await context.queryClient.ensureQueryData(groupInvitesQuery(group.id));
    }
  },
});
