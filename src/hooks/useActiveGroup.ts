import { useSuspenseQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import { resolveActiveGroupId } from "@/lib/activeGroup";
import type { Group } from "@/api/groups/types";

interface ActiveGroupState {
  activeGroupId: string | undefined;
  activeGroup: Group | undefined;
  groups: Group[];
  hasGroups: boolean;
}

// Only call for a signed-in user - callers should gate rendering on that
// rather than passing an optional userId, since this suspends until data
// resolves.
export function useActiveGroup(userId: string): ActiveGroupState {
  const { profile } = useAuth();
  const { data: groups } = useSuspenseQuery(userGroupsQuery(userId));

  const activeGroupId = resolveActiveGroupId({
    profileActiveGroupId: profile?.active_group_id,
    groupIds: groups.map((group) => group.id),
  });

  return {
    activeGroupId,
    activeGroup: groups.find((group) => group.id === activeGroupId),
    groups,
    hasGroups: groups.length > 0,
  };
}
