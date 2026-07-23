import { useAuth } from "@/contexts/AuthContext";
import { useUserGroupsQuery } from "@/api/groups/useUserGroups";
import { resolveActiveGroupId } from "@/lib/activeGroup";
import type { Group } from "@/api/groups/types";

interface ActiveGroupState {
  activeGroupId: string | undefined;
  activeGroup: Group | undefined;
  groups: Group[];
  hasGroups: boolean;
  isLoading: boolean;
}

export function useActiveGroup(): ActiveGroupState {
  const { user, profile } = useAuth();
  const groupsQuery = useUserGroupsQuery(user?.id);
  const groups = groupsQuery.data ?? [];

  const activeGroupId = resolveActiveGroupId({
    profileActiveGroupId: profile?.active_group_id,
    groupIds: groups.map((group) => group.id),
  });

  return {
    activeGroupId,
    activeGroup: groups.find((group) => group.id === activeGroupId),
    groups,
    hasGroups: groups.length > 0,
    isLoading: groupsQuery.isLoading,
  };
}
