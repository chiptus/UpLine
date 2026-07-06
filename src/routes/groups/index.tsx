import { createFileRoute } from "@tanstack/react-router";
import Groups from "@/pages/groups/Groups";
import { userGroupsQuery } from "@/api/groups/useUserGroups";

export const Route = createFileRoute("/groups/")({
  component: Groups,
  loader: async ({ context }) => {
    if (context.user) {
      await context.queryClient.ensureQueryData(
        userGroupsQuery(context.user.id, { all: false }),
      );
    }
  },
});
