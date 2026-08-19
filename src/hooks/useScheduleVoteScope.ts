import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import type { MeGroupVoteScope } from "@/lib/voteScope";

/**
 * Resolves the Schedule tab's Vote Scope (Me / Active Group): the URL choice
 * when one was made, else Active Group when the user has one, else Me.
 * Also resolves the Active Group's member ids for group-scope filtering,
 * `undefined` while loading (or when there's no active group).
 */
export function useScheduleVoteScope(tab: "timeline" | "list") {
  const { user } = useAuth();
  const { activeGroupId } = useActiveScope();
  const { voteScope: urlVoteScope, updateVoteScope } = useTimelineUrlState(tab);
  const { data: groups } = useQuery({
    ...userGroupsQuery(user?.id ?? ""),
    enabled: !!user,
  });
  const { data: members } = useQuery({
    ...groupMembersQuery(activeGroupId ?? ""),
    enabled: !!activeGroupId,
  });

  const groupName = activeGroupId
    ? groups?.find((group) => group.id === activeGroupId)?.name
    : undefined;

  const groupMemberIds = useMemo(
    () =>
      members ? new Set(members.map((member) => member.user_id)) : undefined,
    [members],
  );

  const voteScope: MeGroupVoteScope =
    urlVoteScope === "group" && activeGroupId
      ? "group"
      : urlVoteScope === "me"
        ? "me"
        : activeGroupId
          ? "group"
          : "me";

  return {
    voteScope,
    activeGroupId,
    groupName,
    groupMemberIds: voteScope === "group" ? groupMemberIds : undefined,
    updateVoteScope,
  };
}
